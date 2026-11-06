#!/usr/bin/env python3
"""Compara o ranker v3 com um encoder E5 ONNX no conjunto E2E rotulado."""

from __future__ import annotations

import argparse
import json
import re
import statistics
import sys
import time
from pathlib import Path

import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer

sys.path.insert(0, str(Path(__file__).resolve().parent))
from evaluate_live_recommendations import (  # noqa: E402
    PROFILES,
    PROJECTS,
    ndcg,
    pairwise_accuracy,
    pearson,
    ranks,
)


NEGATION_PATTERNS = (
    re.compile(r"\bn[aãa]o\s+(?:tenho|possuo|domino|conheço|trabalhei)\b", re.IGNORECASE),
    re.compile(r"\bsem\s+(?:experiência|conhecimento|prática)\b", re.IGNORECASE),
    re.compile(r"\bapenas\s+copi(?:ei|ado|ada)\b", re.IGNORECASE),
)


class E5Encoder:
    def __init__(self, model_path: Path, tokenizer_path: Path) -> None:
        options = ort.SessionOptions()
        options.intra_op_num_threads = 4
        options.inter_op_num_threads = 1
        self.session = ort.InferenceSession(str(model_path), sess_options=options, providers=["CPUExecutionProvider"])
        self.tokenizer = Tokenizer.from_file(str(tokenizer_path))
        self.tokenizer.enable_truncation(max_length=512)
        self.tokenizer.enable_padding(pad_id=1, pad_token="<pad>")

    def encode(self, texts: list[str]) -> np.ndarray:
        encoded = self.tokenizer.encode_batch(texts)
        ids = np.asarray([item.ids for item in encoded], dtype=np.int64)
        mask = np.asarray([item.attention_mask for item in encoded], dtype=np.int64)
        token_types = np.zeros_like(ids)
        inputs = {"input_ids": ids, "attention_mask": mask}
        if any(item.name == "token_type_ids" for item in self.session.get_inputs()):
            inputs["token_type_ids"] = token_types
        hidden = self.session.run(None, inputs)[0]
        expanded_mask = mask[:, :, None].astype(np.float32)
        pooled = (hidden * expanded_mask).sum(axis=1) / np.maximum(expanded_mask.sum(axis=1), 1e-9)
        return pooled / np.maximum(np.linalg.norm(pooled, axis=1, keepdims=True), 1e-12)


def profile_text(profile: dict[str, object]) -> str:
    return "\n\n".join(value for value in (str(profile["bio"]), str(profile["portfolio"])) if value).strip()


def metrics(rows_by_project: dict[str, list[dict[str, float | int | str]]]) -> dict[str, float]:
    scenarios = []
    for rows in rows_by_project.values():
        ordered = sorted(rows, key=lambda row: (-float(row["score"]), str(row["profile"])))
        grades = [int(row["grade"]) for row in ordered]
        scores = [float(row["score"]) for row in ordered]
        scenarios.append(
            {
                "ndcg5": ndcg(grades, scores, 5),
                "ndcg10": ndcg(grades, scores, 10),
                "spearman": pearson(ranks([float(value) for value in grades]), ranks(scores)),
                "pairwise": pairwise_accuracy(grades, scores),
                "p3": sum(grade >= 2 for grade in grades[:3]) / 3.0,
                "top1": float(grades[0] == max(grades)),
            }
        )
    return {key: statistics.fmean(item[key] for item in scenarios) for key in scenarios[0]}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--tokenizer", type=Path, required=True)
    parser.add_argument("--baseline", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=Path("/tmp/synapse-semantic-benchmark.json"))
    args = parser.parse_args()

    baseline_report = json.loads(args.baseline.read_text(encoding="utf-8"))
    baseline_scores = {
        scenario["project"]: {row["profile"]: float(row["score"]) for row in scenario["created_candidate_ranking"]}
        for scenario in baseline_report["scenarios"]
    }
    encoder = E5Encoder(args.model, args.tokenizer)
    documents = [f"passage: {profile_text(profile)}" for profile in PROFILES]
    started = time.perf_counter()
    document_embeddings = encoder.encode(documents)
    document_ms = (time.perf_counter() - started) * 1000.0

    semantic_scores: dict[str, dict[str, float]] = {}
    query_latencies = []
    for project in PROJECTS:
        started = time.perf_counter()
        query = encoder.encode([f"query: {project['description']}"])[0]
        query_latencies.append((time.perf_counter() - started) * 1000.0)
        semantic_scores[str(project["key"])] = {
            str(profile["key"]): float(query @ embedding)
            for profile, embedding in zip(PROFILES, document_embeddings)
        }

    candidates: dict[str, object] = {}
    best_key = ""
    best_objective = -1.0
    for semantic_weight in (0.0, 0.25, 0.5, 0.75, 1.0):
        for negation_factor in (1.0, 0.5, 0.25, 0.0):
            rows_by_project: dict[str, list[dict[str, float | int | str]]] = {}
            for project in PROJECTS:
                project_key = str(project["key"])
                rows = []
                for profile in PROFILES:
                    key = str(profile["key"])
                    lexical = baseline_scores[project_key][key] / 100.0
                    semantic = semantic_scores[project_key][key]
                    # O E5 concentra cossenos em uma faixa alta. O deslocamento
                    # preserva a ordenação e aproxima a escala da feature lexical.
                    semantic_index = float(np.clip((semantic - 0.65) / 0.25, 0.0, 1.0))
                    score = (1.0 - semantic_weight) * lexical + semantic_weight * semantic_index
                    text = profile_text(profile)
                    if any(pattern.search(text) for pattern in NEGATION_PATTERNS):
                        score *= negation_factor
                    rows.append({"profile": key, "grade": int(profile["grades"][project_key]), "score": score})
                rows_by_project[project_key] = rows
            result = metrics(rows_by_project)
            critical_false_positive = max(
                float(row["score"])
                for rows in rows_by_project.values()
                for row in rows
                if int(row["grade"]) == 0
            )
            critical_false_negative = min(
                float(row["score"])
                for rows in rows_by_project.values()
                for row in rows
                if int(row["grade"]) == 3
            )
            objective = result["ndcg5"] + 0.25 * result["p3"] + 0.1 * result["spearman"]
            key = f"semantic={semantic_weight:.2f},negation={negation_factor:.2f}"
            candidates[key] = {
                **result,
                "max_grade0": critical_false_positive * 100.0,
                "min_grade3": critical_false_negative * 100.0,
            }
            if result["top1"] == 1.0 and objective > best_objective:
                best_key = key
                best_objective = objective

    report = {
        "model": str(args.model),
        "document_batch_ms": document_ms,
        "query_ms_mean": statistics.fmean(query_latencies),
        "query_ms_max": max(query_latencies),
        "semantic_cosine_range": {
            "min": min(score for project in semantic_scores.values() for score in project.values()),
            "max": max(score for project in semantic_scores.values() for score in project.values()),
        },
        "best_candidate": best_key,
        "candidates": candidates,
        "semantic_scores": semantic_scores,
    }
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
