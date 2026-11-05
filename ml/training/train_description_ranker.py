#!/usr/bin/env python3
"""Treina o ranker v3 usando exclusivamente pares de descrições textuais.

O CSV de entrada deve possuir ``project_description``, ``profile_description``
e ``label`` (0 ou 1). Uma coluna ``project_id`` é recomendada para separar os
projetos entre treino e validação sem vazamento.

Exemplo:
    python training/train_description_ranker.py \
      --input data/processed/description_pairs.csv \
      --output models/description_ranker.joblib
"""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import HashingVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, brier_score_loss, log_loss, ndcg_score, roc_auc_score
from sklearn.model_selection import GroupShuffleSplit, train_test_split


TOKEN_RE = re.compile(r"[a-z0-9+#.]+", re.IGNORECASE)
FEATURE_NAMES = ["text_similarity", "token_jaccard", "profile_word_count", "project_word_count"]


def clean(value: object) -> str:
    return " ".join(str(value if value is not None else "").split())


def tokens(value: str) -> set[str]:
    return {token.casefold() for token in TOKEN_RE.findall(value)}


def features(frame: pd.DataFrame, vectorizer: HashingVectorizer) -> np.ndarray:
    profiles = frame["profile_description"].map(clean).tolist()
    projects = frame["project_description"].map(clean).tolist()
    profile_vectors = vectorizer.transform(profiles)
    project_vectors = vectorizer.transform(projects)
    similarities = np.asarray(profile_vectors.multiply(project_vectors).sum(axis=1)).ravel()
    matrix = np.zeros((len(frame), len(FEATURE_NAMES)), dtype=np.float32)
    for index, (profile, project) in enumerate(zip(profiles, projects)):
        profile_tokens = tokens(profile)
        project_tokens = tokens(project)
        union = profile_tokens | project_tokens
        matrix[index] = [
            float(similarities[index]),
            len(profile_tokens & project_tokens) / len(union) if union else 0.0,
            float(len(profile_tokens)),
            float(len(project_tokens)),
        ]
    return matrix


def split(frame: pd.DataFrame, seed: int) -> tuple[pd.DataFrame, pd.DataFrame]:
    if "project_id" in frame.columns and frame["project_id"].nunique() > 1:
        train_indices, validation_indices = next(
            GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=seed).split(frame, groups=frame["project_id"])
        )
        return frame.iloc[train_indices].copy(), frame.iloc[validation_indices].copy()
    train, validation = train_test_split(
        frame, test_size=0.2, random_state=seed, stratify=frame["label"]
    )
    return train.copy(), validation.copy()


def ranking_ndcg(frame: pd.DataFrame, scores: np.ndarray) -> float | None:
    if "project_id" not in frame.columns:
        return None
    values: list[float] = []
    scored = frame.assign(_score=scores)
    for _, group in scored.groupby("project_id"):
        if len(group) < 2 or group["label"].sum() == 0:
            continue
        values.append(float(ndcg_score([group["label"].to_numpy()], [group["_score"].to_numpy()], k=10)))
    return float(np.mean(values)) if values else None


def ranking_mrr(frame: pd.DataFrame, scores: np.ndarray) -> float | None:
    if "project_id" not in frame.columns:
        return None
    values: list[float] = []
    scored = frame.assign(_score=scores)
    for _, group in scored.groupby("project_id"):
        ordered = group.sort_values("_score", ascending=False)["label"].to_numpy()
        positive_positions = np.flatnonzero(ordered == 1)
        if len(positive_positions):
            values.append(1.0 / float(positive_positions[0] + 1))
    return float(np.mean(values)) if values else None


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--regularization", type=float, default=0.1, help="Parâmetro C da regressão logística.")
    parser.add_argument("--max-saturation-rate", type=float, default=0.01)
    parser.add_argument("--min-roc-auc", type=float, default=0.60)
    parser.add_argument("--min-average-precision", type=float, default=0.35)
    parser.add_argument("--min-ndcg", type=float, default=0.55)
    parser.add_argument("--min-mrr", type=float, default=0.65)
    args = parser.parse_args()

    frame = pd.read_csv(args.input)
    required = {"project_description", "profile_description", "label"}
    missing = required.difference(frame.columns)
    if missing:
        raise ValueError(f"Colunas ausentes: {', '.join(sorted(missing))}")
    frame = frame.dropna(subset=["project_description", "profile_description", "label"]).copy()
    frame["label"] = pd.to_numeric(frame["label"], errors="raise").astype(int)
    if set(frame["label"].unique()) != {0, 1}:
        raise ValueError("O dataset precisa conter exemplos positivos e negativos com labels 0 e 1.")

    train, validation = split(frame, args.seed)
    vectorizer = HashingVectorizer(
        lowercase=True,
        strip_accents="unicode",
        analyzer="char_wb",
        ngram_range=(3, 5),
        n_features=2**18,
        alternate_sign=False,
        norm="l2",
    )
    model = LogisticRegression(max_iter=1_000, C=args.regularization, random_state=args.seed)
    model.fit(features(train, vectorizer), train["label"].to_numpy())

    probabilities = model.predict_proba(features(validation, vectorizer))[:, 1]
    metrics = {
        "roc_auc": float(roc_auc_score(validation["label"], probabilities)),
        "average_precision": float(average_precision_score(validation["label"], probabilities)),
        "brier_loss": float(brier_score_loss(validation["label"], probabilities)),
        "log_loss": float(log_loss(validation["label"], probabilities)),
        "ndcg@10": ranking_ndcg(validation, probabilities),
        "mrr": ranking_mrr(validation, probabilities),
        "score_p05": float(np.quantile(probabilities, 0.05)),
        "score_p50": float(np.quantile(probabilities, 0.50)),
        "score_p95": float(np.quantile(probabilities, 0.95)),
        "saturation_rate_99_5": float(np.mean(probabilities >= 0.995)),
        "train_rows": int(len(train)),
        "validation_rows": int(len(validation)),
        "train_projects": int(train["project_id"].nunique()) if "project_id" in train else None,
        "validation_projects": int(validation["project_id"].nunique()) if "project_id" in validation else None,
    }
    quality_gates = {
        "roc_auc": (metrics["roc_auc"], args.min_roc_auc, ">="),
        "average_precision": (metrics["average_precision"], args.min_average_precision, ">="),
        "ndcg@10": (metrics["ndcg@10"], args.min_ndcg, ">="),
        "mrr": (metrics["mrr"], args.min_mrr, ">="),
        "saturation_rate_99_5": (metrics["saturation_rate_99_5"], args.max_saturation_rate, "<="),
    }
    failed_gates: list[str] = []
    for name, (value, threshold, operator) in quality_gates.items():
        failed = value is None or (operator == ">=" and value < threshold) or (operator == "<=" and value > threshold)
        if failed:
            displayed_value = "ausente" if value is None else f"{value:.6f}"
            failed_gates.append(f"{name}={displayed_value} (exigido {operator} {threshold:.6f})")
    if failed_gates:
        raise ValueError("Modelo rejeitado pelos gates de qualidade: " + "; ".join(failed_gates))

    artifact = {
        "artifact_version": "description-ranker-v3",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "label_definition": "observed application in a 1:3 sampled candidate set",
        "score_semantics": "application affinity index; not hiring probability",
        "regularization_c": args.regularization,
        "quality_gates": quality_gates,
        "model": model,
        "vectorizer": vectorizer,
        "feature_names": FEATURE_NAMES,
        "metrics": metrics,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, args.output)
    args.output.with_suffix(".metrics.json").write_text(
        json.dumps(
            {
                "artifact_version": artifact["artifact_version"],
                "trained_at": artifact["trained_at"],
                "label_definition": artifact["label_definition"],
                "score_semantics": artifact["score_semantics"],
                "regularization_c": artifact["regularization_c"],
                "quality_gates": artifact["quality_gates"],
                "feature_names": artifact["feature_names"],
                "metrics": metrics,
            },
            ensure_ascii=False,
            indent=2,
        ) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(metrics, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
