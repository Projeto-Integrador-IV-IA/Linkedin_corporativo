#!/usr/bin/env python3
"""Treina um ranking supervisionado de candidatos para vagas.

O dataset job-recommendation não possui uma coluna de contratação ou de
qualidade da contratação. Por isso, uma candidatura registrada em ``apps.tsv``
é usada como relevância 1 e vagas não candidatas, amostradas para o mesmo
usuário/janela, como relevância 0.

O modelo é um XGBRanker. A saída bruta do ranker ordena os candidatos; uma
regressão logística treinada na validação transforma essa saída em um índice
calibrado de 0 a 100 para a API.

Exemplo:

    python training/train_ranker.py \
      --data-dir data/job-recommendation \
      --output models/job_ranker.joblib \
      --max-queries 20000

Remova ``--max-queries`` (ou use 0) para treinar com todas as consultas. O
limite é útil para validar o pipeline antes de processar o dataset completo.
"""

from __future__ import annotations

import argparse
import csv
import html
import json
import random
import re
import sys
import zipfile
from collections import defaultdict
from pathlib import Path
from typing import Any, Iterable

import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from xgboost import XGBRanker


FEATURE_NAMES = [
    "text_similarity",
    "token_jaccard",
    "city_match",
    "state_match",
    "country_match",
    "years_experience",
    "work_history_count",
    "managed_others",
    "profile_word_count",
    "job_title_word_count",
    "requirements_word_count",
    "has_profile_history",
]

TAG_RE = re.compile(r"<[^>]*>")
TOKEN_RE = re.compile(r"[a-z0-9+#.]+", re.IGNORECASE)


def clean_text(value: Any) -> str:
    """Remove HTML e normaliza um campo textual do dataset."""

    if value is None or (isinstance(value, float) and np.isnan(value)):
        return ""
    value = html.unescape(str(value))
    value = TAG_RE.sub(" ", value)
    return re.sub(r"\s+", " ", value).strip()


def tokens(value: str) -> set[str]:
    return {token.lower() for token in TOKEN_RE.findall(value)}


def query_key(user_id: int, window_id: int) -> tuple[int, int]:
    return int(user_id), int(window_id)


def load_source_tables(data_dir: Path) -> tuple[dict, dict, dict[str, list[int]]]:
    """Carrega usuários, histórico e candidaturas de treino.

    A chave de uma consulta é (UserID, WindowID). Usamos somente as linhas
    marcadas como Train e mantemos a divisão temporal por janela para avaliação.
    """

    users = pd.read_csv(
        data_dir / "users.tsv",
        sep="\t",
        usecols=[
            "UserID",
            "WindowID",
            "Split",
            "City",
            "State",
            "Country",
            "DegreeType",
            "Major",
            "WorkHistoryCount",
            "TotalYearsExperience",
            "CurrentlyEmployed",
            "ManagedOthers",
        ],
        keep_default_na=False,
    )
    users = users[users["Split"].eq("Train")].copy()
    user_info: dict[tuple[int, int], dict[str, Any]] = {}
    for row in users.to_dict("records"):
        key = query_key(row["UserID"], row["WindowID"])
        user_info[key] = row

    history = pd.read_csv(
        data_dir / "user_history.tsv",
        sep="\t",
        usecols=["UserID", "WindowID", "Split", "Sequence", "JobTitle"],
        keep_default_na=False,
    )
    history = history[history["Split"].eq("Train")].copy()
    history["JobTitle"] = history["JobTitle"].map(clean_text)
    profiles = (
        history.sort_values("Sequence")
        .groupby(["UserID", "WindowID"], sort=False)["JobTitle"]
        .agg(" ".join)
        .to_dict()
    )
    profiles = {query_key(k[0], k[1]): v for k, v in profiles.items()}

    apps = pd.read_csv(
        data_dir / "apps.tsv",
        sep="\t",
        usecols=["UserID", "WindowID", "Split", "JobID"],
        keep_default_na=False,
    )
    apps = apps[apps["Split"].eq("Train")].copy()
    apps["UserID"] = pd.to_numeric(apps["UserID"], errors="coerce").astype("int64")
    apps["WindowID"] = pd.to_numeric(apps["WindowID"], errors="coerce").astype("int64")
    apps["JobID"] = pd.to_numeric(apps["JobID"], errors="coerce").astype("int64")

    positives: dict[tuple[int, int], list[int]] = defaultdict(list)
    for row in apps.itertuples(index=False):
        key = query_key(row.UserID, row.WindowID)
        if key in user_info:
            positives[key].append(int(row.JobID))

    # Evita duplicar a mesma vaga se houver mais de um registro da candidatura.
    positives = {key: sorted(set(job_ids)) for key, job_ids in positives.items()}
    return user_info, profiles, positives


def choose_queries(
    positives: dict[tuple[int, int], list[int]],
    max_queries: int,
    seed: int,
) -> dict[str, list[tuple[int, int]]]:
    """Separa consultas por tempo: janelas 1-5 treino, 6 validação, 7 teste."""

    rng = random.Random(seed)
    by_split: dict[str, list[tuple[int, int]]] = {"train": [], "validation": [], "test": []}
    for key in positives:
        window = key[1]
        split = "train" if window <= 5 else "validation" if window == 6 else "test"
        by_split[split].append(key)

    for split, keys in by_split.items():
        keys.sort()
        if max_queries > 0 and len(keys) > max_queries:
            keys = rng.sample(keys, max_queries)
            keys.sort()
        by_split[split] = keys
    return by_split


def make_pairs(
    queries: Iterable[tuple[int, int]],
    positives: dict[tuple[int, int], list[int]],
    job_pool: np.ndarray,
    negative_ratio: int,
    max_negatives_per_query: int,
    seed: int,
) -> pd.DataFrame:
    """Cria grupos de ranking, mantendo os positivos e amostrando negativos."""

    rng = np.random.default_rng(seed)
    records: list[dict[str, Any]] = []
    for key in queries:
        positive_ids = positives[key]
        positive_set = set(positive_ids)
        wanted = len(positive_ids) * negative_ratio
        if max_negatives_per_query > 0:
            wanted = min(wanted, max_negatives_per_query)

        negative_ids: set[int] = set()
        # Amostragem em blocos reduz o custo quando a vaga positiva ocupa uma
        # pequena fração do catálogo.
        while len(negative_ids) < wanted:
            sample_size = max(32, (wanted - len(negative_ids)) * 3)
            sampled = rng.choice(job_pool, size=sample_size, replace=True)
            negative_ids.update(
                int(job_id)
                for job_id in sampled
                if int(job_id) not in positive_set
            )

        for job_id in positive_ids:
            records.append({"UserID": key[0], "WindowID": key[1], "JobID": job_id, "label": 1})
        for job_id in negative_ids:
            records.append({"UserID": key[0], "WindowID": key[1], "JobID": job_id, "label": 0})

    return pd.DataFrame.from_records(records)


def load_jobs(data_dir: Path, wanted_ids: set[int]) -> dict[int, dict[str, str]]:
    """Lê somente as vagas usadas nos pares, diretamente do TSV ou do ZIP."""

    plain_path = data_dir / "jobs.tsv"
    zip_path = data_dir / "jobs.zip"
    if plain_path.exists():
        stream: Any = plain_path.open("r", encoding="utf-8", errors="replace", newline="")
        context: Any = stream
    elif zip_path.exists():
        archive = zipfile.ZipFile(zip_path)
        member = next((name for name in archive.namelist() if name.endswith("jobs.tsv")), None)
        if member is None:
            raise FileNotFoundError(f"Não encontrei jobs.tsv em {zip_path}")
        stream = archive.open(member, "r")
        context = _ZipTextContext(archive, stream)
    else:
        raise FileNotFoundError(f"Não encontrei jobs.tsv nem jobs.zip em {data_dir}")

    result: dict[int, dict[str, str]] = {}
    csv.field_size_limit(sys.maxsize)
    try:
        with context as text_stream:
            reader = csv.reader(text_stream, delimiter="\t", quoting=csv.QUOTE_NONE)
            next(reader, None)
            for row in reader:
                if len(row) < 8:
                    continue
                try:
                    job_id = int(row[0])
                except ValueError:
                    continue
                if job_id not in wanted_ids:
                    continue
                result[job_id] = {
                    "title": clean_text(row[2]),
                    "requirements": clean_text(row[4])[:6000],
                    "city": clean_text(row[5]),
                    "state": clean_text(row[6]),
                    "country": clean_text(row[7]),
                }
                if len(result) == len(wanted_ids):
                    break
    finally:
        if isinstance(context, _ZipTextContext):
            context.close_archive()

    missing = wanted_ids.difference(result)
    if missing:
        example = sorted(missing)[:5]
        raise ValueError(f"{len(missing)} vagas não foram encontradas em jobs.tsv; exemplos: {example}")
    return result


class _ZipTextContext:
    """Context manager que decodifica um membro ZIP sem extrair o arquivo."""

    def __init__(self, archive: zipfile.ZipFile, raw_stream: Any) -> None:
        import io

        self.archive = archive
        self.raw_stream = raw_stream
        self.text_stream = io.TextIOWrapper(raw_stream, encoding="utf-8", errors="replace", newline="")

    def __enter__(self) -> Any:
        return self.text_stream

    def __exit__(self, *_args: Any) -> None:
        self.text_stream.close()

    def close_archive(self) -> None:
        self.archive.close()


def profile_text(user: dict[str, Any], history: str) -> str:
    fields = [history, clean_text(user.get("Major", "")), clean_text(user.get("DegreeType", ""))]
    return " ".join(field for field in fields if field)


def job_text(job: dict[str, str]) -> str:
    return " ".join(field for field in (job["title"], job["requirements"]) if field)


def build_features(
    pairs: pd.DataFrame,
    user_info: dict[tuple[int, int], dict[str, Any]],
    profiles: dict[tuple[int, int], str],
    jobs: dict[int, dict[str, str]],
    vectorizer: TfidfVectorizer,
) -> np.ndarray:
    """Transforma cada par usuário-vaga em features numéricas."""

    keys = [query_key(row.UserID, row.WindowID) for row in pairs.itertuples(index=False)]
    job_ids = [int(row.JobID) for row in pairs.itertuples(index=False)]
    profile_values = [profile_text(user_info[key], profiles.get(key, "")) for key in keys]
    job_values = [job_text(jobs[job_id]) for job_id in job_ids]

    profile_vectors = vectorizer.transform(profile_values)
    job_vectors = vectorizer.transform(job_values)
    similarity = np.asarray(profile_vectors.multiply(job_vectors).sum(axis=1)).ravel()

    matrix = np.zeros((len(pairs), len(FEATURE_NAMES)), dtype=np.float32)
    for index, (key, job_id, profile_value) in enumerate(zip(keys, job_ids, profile_values)):
        user = user_info[key]
        job = jobs[job_id]
        profile_tokens = tokens(profile_value)
        job_tokens = tokens(job_values[index])
        union = profile_tokens | job_tokens
        intersection = profile_tokens & job_tokens

        def numeric(field: str, default: float = 0.0) -> float:
            try:
                return float(user.get(field, default) or default)
            except (TypeError, ValueError):
                return default

        matrix[index] = [
            float(similarity[index]),
            len(intersection) / len(union) if union else 0.0,
            float(clean_text(user.get("City", "")).casefold() == job["city"].casefold()),
            float(clean_text(user.get("State", "")).casefold() == job["state"].casefold()),
            float(clean_text(user.get("Country", "")).casefold() == job["country"].casefold()),
            numeric("TotalYearsExperience"),
            numeric("WorkHistoryCount"),
            float(clean_text(user.get("ManagedOthers", "")).casefold() == "yes"),
            float(len(profile_tokens)),
            float(len(tokens(job["title"]))),
            float(len(tokens(job["requirements"]))),
            float(bool(profiles.get(key, ""))),
        ]
    return matrix


def fit_vectorizer(training_pairs: pd.DataFrame, profiles: dict, user_info: dict, jobs: dict) -> TfidfVectorizer:
    texts: list[str] = []
    seen_keys: set[tuple[int, int]] = set()
    seen_jobs: set[int] = set()
    for row in training_pairs.itertuples(index=False):
        key = query_key(row.UserID, row.WindowID)
        job_id = int(row.JobID)
        if key not in seen_keys:
            texts.append(profile_text(user_info[key], profiles.get(key, "")))
            seen_keys.add(key)
        if job_id not in seen_jobs:
            texts.append(job_text(jobs[job_id]))
            seen_jobs.add(job_id)

    vectorizer = TfidfVectorizer(
        lowercase=True,
        strip_accents="unicode",
        ngram_range=(1, 2),
        min_df=1,
        max_features=50000,
        sublinear_tf=True,
    )
    vectorizer.fit(texts)
    return vectorizer


def ndcg_at_k(pairs: pd.DataFrame, scores: np.ndarray, k: int = 10) -> float:
    values: list[float] = []
    offset = 0
    for _, group in pairs.groupby(["UserID", "WindowID"], sort=False):
        size = len(group)
        labels = group["label"].to_numpy()[np.argsort(-scores[offset : offset + size])][:k]
        ideal = np.sort(group["label"].to_numpy())[::-1][:k]
        discounts = np.log2(np.arange(2, len(labels) + 2))
        dcg = float(np.sum((2**labels - 1) / discounts))
        ideal_dcg = float(np.sum((2**ideal - 1) / discounts[: len(ideal)]))
        values.append(dcg / ideal_dcg if ideal_dcg else 0.0)
        offset += size
    return float(np.mean(values)) if values else 0.0


def mrr(pairs: pd.DataFrame, scores: np.ndarray) -> float:
    values: list[float] = []
    offset = 0
    for _, group in pairs.groupby(["UserID", "WindowID"], sort=False):
        size = len(group)
        labels = group["label"].to_numpy()[np.argsort(-scores[offset : offset + size])]
        positive_positions = np.flatnonzero(labels == 1)
        values.append(1.0 / (positive_positions[0] + 1) if len(positive_positions) else 0.0)
        offset += size
    return float(np.mean(values)) if values else 0.0


def evaluate(pairs: pd.DataFrame, scores: np.ndarray) -> dict[str, float]:
    return {"ndcg@10": ndcg_at_k(pairs, scores, 10), "mrr": mrr(pairs, scores)}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--negative-ratio", type=int, default=3)
    parser.add_argument("--max-negatives-per-query", type=int, default=30)
    parser.add_argument("--max-queries", type=int, default=0, help="0 = todas as consultas")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--estimators", type=int, default=250)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.negative_ratio < 1:
        raise ValueError("--negative-ratio deve ser >= 1")
    if not args.data_dir.exists():
        raise FileNotFoundError(args.data_dir)

    print("Carregando usuários, histórico e candidaturas...", flush=True)
    user_info, profiles, positives = load_source_tables(args.data_dir)
    query_splits = choose_queries(positives, args.max_queries, args.seed)
    job_pool = np.array(sorted({job_id for ids in positives.values() for job_id in ids}), dtype=np.int64)
    if len(job_pool) < 2:
        raise ValueError("O catálogo de vagas é insuficiente para amostrar negativos")

    pairs: dict[str, pd.DataFrame] = {}
    for index, split in enumerate(("train", "validation", "test")):
        print(f"Gerando pares de {split} ({len(query_splits[split])} consultas)...", flush=True)
        pairs[split] = make_pairs(
            query_splits[split],
            positives,
            job_pool,
            args.negative_ratio,
            args.max_negatives_per_query,
            args.seed + index,
        )
    if pairs["train"].empty or pairs["validation"].empty:
        raise ValueError("Treino e validação precisam conter pelo menos uma consulta")

    wanted_jobs = set(pd.concat(list(pairs.values()), ignore_index=True)["JobID"].astype(int))
    print(f"Lendo texto de {len(wanted_jobs)} vagas...", flush=True)
    jobs = load_jobs(args.data_dir, wanted_jobs)

    print("Ajustando TF-IDF e transformando features...", flush=True)
    vectorizer = fit_vectorizer(pairs["train"], profiles, user_info, jobs)
    matrices = {
        split: build_features(frame, user_info, profiles, jobs, vectorizer)
        for split, frame in pairs.items()
        if not frame.empty
    }

    train = pairs["train"]
    validation = pairs["validation"]
    model = XGBRanker(
        objective="rank:ndcg",
        eval_metric="ndcg@10",
        n_estimators=args.estimators,
        max_depth=6,
        learning_rate=0.08,
        subsample=0.85,
        colsample_bytree=0.9,
        min_child_weight=5,
        reg_lambda=1.0,
        tree_method="hist",
        random_state=args.seed,
    )
    train_groups = train.groupby(["UserID", "WindowID"], sort=False).size().to_numpy()
    validation_groups = validation.groupby(["UserID", "WindowID"], sort=False).size().to_numpy()
    print("Treinando XGBRanker...", flush=True)
    model.fit(
        matrices["train"],
        train["label"].to_numpy(),
        group=train_groups,
        eval_set=[(matrices["validation"], validation["label"].to_numpy())],
        eval_group=[validation_groups],
        verbose=False,
    )

    raw_validation = model.predict(matrices["validation"])
    calibrator = LogisticRegression(C=1.0, max_iter=1000)
    calibrator.fit(raw_validation.reshape(-1, 1), validation["label"].to_numpy())

    metrics: dict[str, dict[str, float]] = {"validation": evaluate(validation, raw_validation)}
    if not pairs["test"].empty:
        metrics["test"] = evaluate(pairs["test"], model.predict(matrices["test"]))

    args.output.parent.mkdir(parents=True, exist_ok=True)
    artifact = {
        "model": model,
        "calibrator": calibrator,
        "vectorizer": vectorizer,
        "feature_names": FEATURE_NAMES,
        "metadata": {
            "model_type": "xgboost.XGBRanker",
            "label": "application_observed",
            "score_definition": "100 * calibrated probability of historical application",
            "train_windows": "1-5",
            "validation_window": 6,
            "test_window": 7,
            "negative_ratio": args.negative_ratio,
            "max_negatives_per_query": args.max_negatives_per_query,
            "seed": args.seed,
            "query_counts": {split: len(query_splits[split]) for split in pairs},
            "pair_counts": {split: int(len(frame)) for split, frame in pairs.items()},
            "metrics": metrics,
        },
    }
    joblib.dump(artifact, args.output, compress=3)
    print(json.dumps(artifact["metadata"], indent=2, ensure_ascii=False))
    print(f"Modelo salvo em {args.output}")


if __name__ == "__main__":
    main()
