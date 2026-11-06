#!/usr/bin/env python3
"""Gate de qualidade para um endpoint /predict do ranker híbrido."""

from __future__ import annotations

import argparse
import json
import statistics
import urllib.request
from pathlib import Path
from typing import Any

from evaluate_live_recommendations import PROFILES, PROJECTS, ndcg, pairwise_accuracy, pearson, ranks
from validate_semantic_holdout import PROFILES as HOLDOUT_PROFILES
from validate_semantic_holdout import PROJECTS as HOLDOUT_PROJECTS


def predict(url: str, project: str, profiles: list[tuple[str, str, dict[str, int]]]) -> dict[str, float]:
    payload = {
        "project_description": project,
        "candidates": [{"candidate_id": key, "profile_description": text} for key, text, _ in profiles],
    }
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        body = json.load(response)
    if body.get("ranking_version") != "hybrid-semantic-ranker-v4":
        raise RuntimeError(f"Versão inesperada: {body.get('ranking_version')}")
    return {str(row["candidate_id"]): float(row["score"]) for row in body["results"]}


def main_profiles() -> list[tuple[str, str, dict[str, int]]]:
    return [
        (
            str(profile["key"]),
            "\n\n".join(value for value in (str(profile["bio"]), str(profile["portfolio"])) if value).strip(),
            {str(key): int(value) for key, value in profile["grades"].items()},
        )
        for profile in PROFILES
    ]


def evaluate_group(
    url: str,
    projects: list[dict[str, Any]],
    profiles: list[tuple[str, str, dict[str, int]]],
) -> dict[str, Any]:
    scenarios = []
    all_rows = []
    for project in projects:
        key = str(project["key"])
        project_text = str(project.get("description") or project.get("text") or "")
        scores_by_id = predict(url, project_text, profiles)
        rows = [
            {"project": key, "profile": profile_key, "grade": grades[key], "score": scores_by_id[profile_key]}
            for profile_key, _, grades in profiles
        ]
        rows.sort(key=lambda row: (-row["score"], row["profile"]))
        grades = [int(row["grade"]) for row in rows]
        scores = [float(row["score"]) for row in rows]
        scenario = {
            "project": key,
            "ndcg@5": ndcg(grades, scores, 5),
            "ndcg@10": ndcg(grades, scores, 10),
            "spearman": pearson(ranks([float(value) for value in grades]), ranks(scores)),
            "pairwise_accuracy": pairwise_accuracy(grades, scores),
            "precision@3_grade>=2": sum(grade >= 2 for grade in grades[:3]) / 3.0,
            "top1_is_max_grade": grades[0] == max(grades),
            "top5": rows[:5],
        }
        scenarios.append(scenario)
        all_rows.extend(rows)
    metric_names = ("ndcg@5", "ndcg@10", "spearman", "pairwise_accuracy", "precision@3_grade>=2")
    return {
        "aggregate": {
            **{name: statistics.fmean(float(row[name]) for row in scenarios) for name in metric_names},
            "top1_accuracy": statistics.fmean(float(row["top1_is_max_grade"]) for row in scenarios),
            "max_grade0": max(float(row["score"]) for row in all_rows if row["grade"] == 0),
            "min_grade3": min(float(row["score"]) for row in all_rows if row["grade"] == 3),
        },
        "scenarios": scenarios,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--predict-url", default="http://localhost:8000/predict")
    parser.add_argument("--output", type=Path, default=Path("/tmp/synapse-ranker-v4-quality.json"))
    args = parser.parse_args()

    primary = evaluate_group(args.predict_url, PROJECTS, main_profiles())
    holdout = evaluate_group(args.predict_url, HOLDOUT_PROJECTS, HOLDOUT_PROFILES)
    failures = []
    gates = {
        "primary.top1_accuracy": (primary["aggregate"]["top1_accuracy"], 1.0, ">="),
        "primary.ndcg@5": (primary["aggregate"]["ndcg@5"], 0.95, ">="),
        "primary.spearman": (primary["aggregate"]["spearman"], 0.65, ">="),
        "primary.pairwise_accuracy": (primary["aggregate"]["pairwise_accuracy"], 0.88, ">="),
        "primary.max_grade0": (primary["aggregate"]["max_grade0"], 60.0, "<="),
        "primary.min_grade3": (primary["aggregate"]["min_grade3"], 45.0, ">="),
        "holdout.top1_accuracy": (holdout["aggregate"]["top1_accuracy"], 1.0, ">="),
        "holdout.ndcg@5": (holdout["aggregate"]["ndcg@5"], 0.95, ">="),
        "holdout.pairwise_accuracy": (holdout["aggregate"]["pairwise_accuracy"], 0.93, ">="),
        "holdout.max_grade0": (holdout["aggregate"]["max_grade0"], 50.0, "<="),
        "holdout.min_grade3": (holdout["aggregate"]["min_grade3"], 35.0, ">="),
    }
    for name, (value, threshold, operator) in gates.items():
        if (operator == ">=" and value < threshold) or (operator == "<=" and value > threshold):
            failures.append(f"{name}={value:.4f}, exigido {operator} {threshold:.4f}")
    report = {"ranking_version": "hybrid-semantic-ranker-v4", "gates": gates, "failures": failures, "primary": primary, "holdout": holdout}
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if failures:
        raise SystemExit("Ranker rejeitado: " + "; ".join(failures))


if __name__ == "__main__":
    main()
