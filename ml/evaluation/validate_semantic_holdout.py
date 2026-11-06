#!/usr/bin/env python3
"""Valida a configuração v4 fixa em domínios não usados no ajuste."""

from __future__ import annotations

import argparse
import json
import statistics
import urllib.request
from pathlib import Path
from typing import Any

import numpy as np

from evaluate_live_recommendations import ndcg, pairwise_accuracy, pearson, ranks


SEMANTIC_WEIGHT = 0.70
SEMANTIC_FLOOR = 0.82
SEMANTIC_SPAN = 0.12
NEGATION_FACTOR = 0.25

PROJECTS = [
    {
        "key": "security",
        "text": "Monitorar eventos de segurança, investigar incidentes, operar SIEM, revisar vulnerabilidades, IAM e controles em nuvem, documentar riscos e apoiar resposta a ataques.",
    },
    {
        "key": "finance",
        "text": "Elaborar orçamento e forecast, analisar fluxo de caixa e variações financeiras, apoiar fechamento contábil e apresentar indicadores usando Excel, SQL e Power BI.",
    },
    {
        "key": "customer_success",
        "text": "Conduzir onboarding de clientes SaaS, atender chamados, acompanhar adoção, satisfação e churn, organizar feedbacks e colaborar com produto para melhorar a experiência.",
    },
]

PROFILES = [
    ("security_specialist", "Analista de cibersegurança com SIEM, resposta a incidentes, vulnerabilidades, IAM, riscos e segurança em AWS.", {"security": 3, "finance": 0, "customer_success": 0}),
    ("security_paraphrase", "Protejo ambientes digitais, examino atividades suspeitas, controlo acessos e coordeno a contenção e recuperação diante de ataques.", {"security": 3, "finance": 0, "customer_success": 0}),
    ("devops_adjacent", "Engenheiro de plataforma com AWS, Kubernetes, Linux, observabilidade, redes e automação de infraestrutura.", {"security": 1, "finance": 0, "customer_success": 0}),
    ("controller", "Controller com planejamento orçamentário, forecast, fluxo de caixa, fechamento contábil, Excel e Power BI.", {"security": 0, "finance": 3, "customer_success": 0}),
    ("finance_paraphrase", "Apoio a liderança prevendo receitas e despesas, explicando desvios do plano e transformando números em decisões executivas.", {"security": 0, "finance": 3, "customer_success": 0}),
    ("bi_adjacent", "Analista de BI com SQL, dashboards, indicadores e apresentação de resultados para negócios.", {"security": 0, "finance": 2, "customer_success": 0}),
    ("customer_success", "Customer Success em SaaS com onboarding, adoção, satisfação, churn, atendimento e voz do cliente.", {"security": 0, "finance": 0, "customer_success": 3}),
    ("support_paraphrase", "Ajudo empresas a começarem bem no produto, resolvo dificuldades, acompanho uso e levo necessidades dos clientes para a equipe de produto.", {"security": 0, "finance": 0, "customer_success": 3}),
    ("ux_adjacent", "Pesquisadora UX com entrevistas, jornadas, testes de usabilidade e organização de feedbacks de usuários.", {"security": 0, "finance": 0, "customer_success": 1}),
    ("security_negation", "Não tenho experiência com SIEM, incidentes, vulnerabilidades, IAM, nuvem ou riscos; apenas copiei os requisitos.", {"security": 0, "finance": 0, "customer_success": 0}),
    ("finance_negation", "Sem experiência em orçamento, forecast, caixa, contabilidade, Excel, SQL ou Power BI; somente repeti as palavras da vaga.", {"security": 0, "finance": 0, "customer_success": 0}),
    ("generic", "Profissional comunicativo, organizado, proativo e interessado em novos desafios e aprendizado.", {"security": 0, "finance": 0, "customer_success": 0}),
]


def lexical_scores(url: str, project: str) -> dict[str, float]:
    payload = {
        "project_description": project,
        "candidates": [{"candidate_id": key, "profile_description": text} for key, text, _ in PROFILES],
    }
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        body = json.load(response)
    return {str(row["candidate_id"]): float(row["score"]) / 100.0 for row in body["results"]}


def main() -> None:
    from benchmark_semantic_candidates import E5Encoder, NEGATION_PATTERNS

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--tokenizer", type=Path, required=True)
    parser.add_argument("--predict-url", default="http://localhost:8000/predict")
    parser.add_argument("--output", type=Path, default=Path("/tmp/synapse-semantic-holdout.json"))
    args = parser.parse_args()

    encoder = E5Encoder(args.model, args.tokenizer)
    document_embeddings = encoder.encode([f"passage: {text}" for _, text, _ in PROFILES])
    scenarios: list[dict[str, Any]] = []
    all_rows: list[dict[str, Any]] = []
    for project in PROJECTS:
        lexical = lexical_scores(args.predict_url, project["text"])
        query = encoder.encode([f"query: {project['text']}"])[0]
        rows = []
        for (key, text, grades), embedding in zip(PROFILES, document_embeddings):
            semantic = float(query @ embedding)
            semantic_index = float(np.clip((semantic - SEMANTIC_FLOOR) / SEMANTIC_SPAN, 0.0, 1.0))
            score = (1.0 - SEMANTIC_WEIGHT) * lexical[key] + SEMANTIC_WEIGHT * semantic_index
            if any(pattern.search(text) for pattern in NEGATION_PATTERNS):
                score *= NEGATION_FACTOR
            row = {"project": project["key"], "profile": key, "grade": grades[project["key"]], "score": score * 100.0, "semantic_cosine": semantic}
            rows.append(row)
            all_rows.append(row)
        rows.sort(key=lambda row: (-row["score"], row["profile"]))
        grades = [int(row["grade"]) for row in rows]
        scores = [float(row["score"]) for row in rows]
        scenarios.append(
            {
                "project": project["key"],
                "ndcg@5": ndcg(grades, scores, 5),
                "ndcg@10": ndcg(grades, scores, 10),
                "spearman": pearson(ranks([float(value) for value in grades]), ranks(scores)),
                "pairwise_accuracy": pairwise_accuracy(grades, scores),
                "precision@3_grade>=2": sum(grade >= 2 for grade in grades[:3]) / 3.0,
                "top1_is_max_grade": grades[0] == max(grades),
                "ranking": rows,
            }
        )

    aggregate_keys = ("ndcg@5", "ndcg@10", "spearman", "pairwise_accuracy", "precision@3_grade>=2")
    report = {
        "configuration": {
            "semantic_weight": SEMANTIC_WEIGHT,
            "semantic_floor": SEMANTIC_FLOOR,
            "semantic_span": SEMANTIC_SPAN,
            "negation_factor": NEGATION_FACTOR,
        },
        "aggregate": {
            **{key: statistics.fmean(float(row[key]) for row in scenarios) for key in aggregate_keys},
            "top1_accuracy": statistics.fmean(float(row["top1_is_max_grade"]) for row in scenarios),
            "max_grade0": max(float(row["score"]) for row in all_rows if row["grade"] == 0),
            "min_grade3": min(float(row["score"]) for row in all_rows if row["grade"] == 3),
        },
        "scenarios": scenarios,
    }
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
