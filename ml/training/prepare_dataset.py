#!/usr/bin/env python3
"""Prepara pares textuais projeto--profissional para o ranker v2.

O dataset ``job-recommendation`` registra candidaturas, não contratações. Por
isso, uma candidatura observada é usada como label 1 e um profissional da mesma
janela sem candidatura observada para a vaga é amostrado como label 0.
"""

from __future__ import annotations

import argparse
import csv
import html
import io
import json
import re
import zipfile
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

import numpy as np
import pandas as pd


TAG_RE = re.compile(r"<[^>]*>")


def clean(value: object) -> str:
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return ""
    text = html.unescape(str(value))
    return re.sub(r"\s+", " ", TAG_RE.sub(" ", text)).strip()


def load_profiles(data_dir: Path) -> dict[tuple[int, int], str]:
    history = pd.read_csv(
        data_dir / "user_history.tsv",
        sep="\t",
        usecols=["UserID", "WindowID", "Split", "Sequence", "JobTitle"],
        keep_default_na=False,
    )
    history = history[history["Split"].eq("Train")].copy()
    history["JobTitle"] = history["JobTitle"].map(clean)
    profiles = (
        history.sort_values("Sequence")
        .groupby(["UserID", "WindowID"], sort=False)["JobTitle"]
        .agg(lambda values: " | ".join(value for value in values if value))
    )
    return {
        (int(user_id), int(window_id)): description
        for (user_id, window_id), description in profiles.items()
        if description
    }


def load_applications(
    data_dir: Path,
    profile_keys: set[tuple[int, int]],
) -> pd.DataFrame:
    applications = pd.read_csv(
        data_dir / "apps.tsv",
        sep="\t",
        usecols=["UserID", "WindowID", "Split", "JobID"],
        keep_default_na=False,
    )
    applications = applications[applications["Split"].eq("Train")].copy()
    for column in ("UserID", "WindowID", "JobID"):
        applications[column] = pd.to_numeric(applications[column], errors="coerce")
    applications = applications.dropna(subset=["UserID", "WindowID", "JobID"])
    applications[["UserID", "WindowID", "JobID"]] = applications[["UserID", "WindowID", "JobID"]].astype("int64")
    has_profile = [
        (int(user_id), int(window_id)) in profile_keys
        for user_id, window_id in zip(applications["UserID"], applications["WindowID"])
    ]
    return applications.loc[has_profile, ["UserID", "WindowID", "JobID"]].drop_duplicates()


def choose_projects(applications: pd.DataFrame, max_projects: int, seed: int) -> list[tuple[int, int, list[int]]]:
    grouped = [
        (int(job_id), int(window_id), sorted({int(user_id) for user_id in rows["UserID"]}))
        for (job_id, window_id), rows in applications.groupby(["JobID", "WindowID"], sort=False)
    ]
    if max_projects > 0 and len(grouped) > max_projects:
        rng = np.random.default_rng(seed)
        selected = sorted(rng.choice(len(grouped), size=max_projects, replace=False).tolist())
        grouped = [grouped[index] for index in selected]
    return grouped


def make_candidate_pairs(
    projects: Iterable[tuple[int, int, list[int]]],
    profiles: dict[tuple[int, int], str],
    negative_ratio: int,
    max_positives: int,
    max_negatives: int,
    seed: int,
) -> list[dict[str, object]]:
    rng = np.random.default_rng(seed)
    profiles_by_window: dict[int, list[int]] = defaultdict(list)
    for user_id, window_id in profiles:
        profiles_by_window[window_id].append(user_id)

    records: list[dict[str, object]] = []
    for job_id, window_id, positive_users in projects:
        pool = profiles_by_window.get(window_id, [])
        if not pool:
            continue
        if max_positives > 0 and len(positive_users) > max_positives:
            positive_users = sorted(rng.choice(positive_users, size=max_positives, replace=False).tolist())
        positive_set = set(positive_users)
        wanted_negatives = min(len(positive_users) * negative_ratio, max_negatives) if max_negatives > 0 else len(positive_users) * negative_ratio
        if not positive_users or len(pool) <= len(positive_set):
            continue
        negative_count = min(wanted_negatives, len(pool) - len(positive_set))
        negative_users: set[int] = set()
        while len(negative_users) < negative_count:
            sample_size = max(32, (negative_count - len(negative_users)) * 3)
            negative_users.update(
                int(user_id)
                for user_id in rng.choice(pool, size=sample_size, replace=True)
                if int(user_id) not in positive_set
            )
        selected_negatives = sorted(negative_users)[:negative_count]
        project_id = f"{window_id}:{job_id}"
        for user_id, label in [*((user_id, 1) for user_id in positive_users), *((user_id, 0) for user_id in selected_negatives)]:
            records.append({
                "project_id": project_id,
                "job_id": job_id,
                "profile_description": profiles[(int(user_id), window_id)],
                "label": label,
            })
    return records


def load_project_descriptions(data_dir: Path, wanted_ids: set[int]) -> dict[int, str]:
    zip_path = data_dir / "jobs.zip"
    plain_path = data_dir / "jobs.tsv"
    archive: zipfile.ZipFile | None = None
    if plain_path.exists():
        stream = plain_path.open("r", encoding="utf-8", errors="replace", newline="")
    elif zip_path.exists():
        archive = zipfile.ZipFile(zip_path)
        member = next((name for name in archive.namelist() if name.endswith("jobs.tsv")), None)
        if member is None:
            raise FileNotFoundError(f"Não encontrei jobs.tsv em {zip_path}")
        stream = io.TextIOWrapper(archive.open(member), encoding="utf-8", errors="replace", newline="")
    else:
        raise FileNotFoundError(f"Não encontrei jobs.tsv nem jobs.zip em {data_dir}")

    descriptions: dict[int, str] = {}
    csv.field_size_limit(2**31 - 1)
    try:
        reader = csv.reader(stream, delimiter="\t", quoting=csv.QUOTE_NONE)
        next(reader, None)
        for row in reader:
            if len(row) < 5:
                continue
            try:
                job_id = int(row[0])
            except ValueError:
                continue
            if job_id not in wanted_ids:
                continue
            title = clean(row[2])
            description = clean(row[3])[:12_000]
            requirements = clean(row[4])[:12_000]
            text = "\n\n".join(value for value in (title, description, requirements) if value)[:30_000]
            if text:
                descriptions[job_id] = text
            if len(descriptions) == len(wanted_ids):
                break
    finally:
        stream.close()
        if archive is not None:
            archive.close()
    return descriptions


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--max-projects", type=int, default=10_000)
    parser.add_argument("--negative-ratio", type=int, default=3)
    parser.add_argument("--max-positives", type=int, default=10)
    parser.add_argument("--max-negatives", type=int, default=30)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    profiles = load_profiles(args.data_dir)
    applications = load_applications(args.data_dir, set(profiles))
    projects = choose_projects(applications, args.max_projects, args.seed)
    records = make_candidate_pairs(
        projects, profiles, args.negative_ratio, args.max_positives, args.max_negatives, args.seed
    )
    descriptions = load_project_descriptions(args.data_dir, {int(record["job_id"]) for record in records})
    frame = pd.DataFrame.from_records(records)
    frame["project_description"] = frame["job_id"].map(descriptions)
    frame = frame.dropna(subset=["project_description"])[
        ["project_id", "project_description", "profile_description", "label"]
    ]
    if frame.empty or set(frame["label"].unique()) != {0, 1}:
        raise ValueError("A preparação não produziu pares positivos e negativos válidos.")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    frame.to_csv(args.output, index=False)
    metadata = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "source": "Kaggle job-recommendation competition",
        "label_definition": "1=observed application; 0=sampled professional without observed application",
        "profile_text": "ordered work-history job titles",
        "project_text": "job title, description and requirements",
        "rows": int(len(frame)),
        "projects": int(frame["project_id"].nunique()),
        "positives": int(frame["label"].sum()),
        "negatives": int((frame["label"] == 0).sum()),
        "seed": args.seed,
    }
    args.output.with_suffix(".metadata.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(metadata, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
