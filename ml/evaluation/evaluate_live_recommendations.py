#!/usr/bin/env python3
"""Avalia o ranking publicado por meio do fluxo HTTP real da aplicação.

Cria contas, perfis e projetos temporários, consulta o Gateway repetidamente,
mede a concordância com rótulos ordinais definidos antes da inferência e remove
projetos/perfis em ``finally``. As contas temporárias devem ser apagadas do banco
após a execução usando o ``account_email_prefix`` presente no relatório.
"""

from __future__ import annotations

import argparse
import json
import math
import statistics
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from collections import defaultdict
from pathlib import Path
from typing import Any


PASSWORD = "E2e-modelo-2026!"

PROJECTS = [
    {
        "key": "automation",
        "title": "Automação e integração de sistemas",
        "description": (
            "Desenvolver automações em Python para eliminar tarefas manuais, integrar APIs REST, "
            "processar filas e arquivos e monitorar falhas. A pessoa trabalhará com testes automatizados, "
            "Git, bancos SQL e documentação das integrações."
        ),
        "area": "Engenharia de Software",
    },
    {
        "key": "data",
        "title": "Análise de dados e aprendizado de máquina",
        "description": (
            "Construir pipelines de dados em Python e SQL, explorar indicadores de negócio, criar modelos "
            "de aprendizado de máquina e apresentar resultados em dashboards. Experiência com pandas, "
            "estatística, validação de modelos e comunicação com áreas de negócio."
        ),
        "area": "Dados",
    },
    {
        "key": "ux",
        "title": "Pesquisa e design de experiência",
        "description": (
            "Planejar entrevistas com usuários, mapear jornadas, criar wireframes e protótipos no Figma "
            "e conduzir testes de usabilidade. A pessoa colaborará com produto e engenharia para evoluir "
            "interfaces acessíveis com base em evidências de pesquisa."
        ),
        "area": "Produto e Design",
    },
    {
        "key": "devops",
        "title": "Plataforma cloud e DevOps",
        "description": (
            "Operar infraestrutura em AWS usando Terraform, Kubernetes e Docker, manter pipelines CI/CD, "
            "observabilidade, alertas e resposta a incidentes. Buscamos experiência com Linux, redes, "
            "automação de infraestrutura, segurança e confiabilidade de serviços."
        ),
        "area": "Infraestrutura",
    },
    {
        "key": "marketing",
        "title": "Marketing de conteúdo e SEO",
        "description": (
            "Planejar conteúdo para blog e redes sociais, pesquisar palavras-chave, aplicar SEO, acompanhar "
            "conversão e engajamento e executar campanhas digitais. A pessoa produzirá textos, analisará "
            "métricas e testará formatos para diferentes públicos."
        ),
        "area": "Marketing",
    },
]

PROFILES = [
    {
        "key": "python_automation",
        "name": "Marina Automação",
        "profession": "Engenheira de Automação",
        "bio": "Engenheira Python especializada em automação de processos, APIs REST, SQL, testes e Git.",
        "portfolio": "Implantei robôs que processam arquivos e filas, integram sistemas internos e monitoram falhas.",
        "grades": {"automation": 3, "data": 1, "ux": 0, "devops": 1, "marketing": 0},
    },
    {
        "key": "automation_paraphrase",
        "name": "Caio Integrações",
        "profession": "Analista de Sistemas",
        "bio": "Crio fluxos que substituem rotinas repetitivas e conectam plataformas corporativas.",
        "portfolio": "Entreguei robotização de tarefas, troca de informações entre sistemas e acompanhamento de erros.",
        "grades": {"automation": 3, "data": 0, "ux": 0, "devops": 0, "marketing": 0},
    },
    {
        "key": "verbose_automation",
        "name": "Rafael Automação Sênior",
        "profession": "Engenheiro de Software Sênior",
        "bio": (
            "Profissional com oito anos em engenharia de software, levantamento de requisitos, arquitetura, "
            "desenvolvimento, revisão de código, suporte, documentação e mentoria. Atua com Python, APIs REST, "
            "automação de tarefas, bancos SQL, Git, testes automatizados, filas, processamento de arquivos, "
            "observabilidade e monitoramento de falhas em ambientes corporativos."
        ),
        "portfolio": (
            "Liderou integrações entre ERP, CRM e plataformas financeiras, reduzindo trabalho manual e criando "
            "alertas, retentativas, testes, painéis operacionais e documentação para as equipes de sustentação."
        ),
        "grades": {"automation": 3, "data": 1, "ux": 0, "devops": 1, "marketing": 0},
    },
    {
        "key": "java_backend",
        "name": "João Backend",
        "profession": "Desenvolvedor Java",
        "bio": "Desenvolvedor Java e Spring Boot com microsserviços, APIs REST, PostgreSQL, testes e mensageria.",
        "portfolio": "Construiu serviços transacionais e integrações com sistemas parceiros.",
        "grades": {"automation": 2, "data": 0, "ux": 0, "devops": 1, "marketing": 0},
    },
    {
        "key": "data_scientist",
        "name": "Beatriz Dados",
        "profession": "Cientista de Dados",
        "bio": "Cientista de dados com Python, pandas, SQL, estatística e validação de aprendizado de máquina.",
        "portfolio": "Criou pipelines, modelos preditivos e apresentações de resultados para áreas de negócio.",
        "grades": {"automation": 1, "data": 3, "ux": 0, "devops": 0, "marketing": 0},
    },
    {
        "key": "bi_analyst",
        "name": "Luana BI",
        "profession": "Analista de BI",
        "bio": "Analista de indicadores, SQL, Power BI, dashboards, qualidade de dados e comunicação executiva.",
        "portfolio": "Organizou bases e painéis para acompanhar vendas, operação e conversão.",
        "grades": {"automation": 0, "data": 3, "ux": 0, "devops": 0, "marketing": 1},
    },
    {
        "key": "ux_researcher",
        "name": "Alice UX",
        "profession": "UX Designer",
        "bio": "UX designer com pesquisa, entrevistas, jornadas, wireframes, Figma, acessibilidade e testes de usabilidade.",
        "portfolio": "Conduziu descoberta com usuários e prototipação de produtos digitais junto a produto e engenharia.",
        "grades": {"automation": 0, "data": 0, "ux": 3, "devops": 0, "marketing": 1},
    },
    {
        "key": "graphic_designer",
        "name": "Pedro Visual",
        "profession": "Designer Gráfico",
        "bio": "Designer de identidade visual, ilustração, campanhas, peças digitais e sistemas de marca.",
        "portfolio": "Produziu materiais para redes sociais e interfaces seguindo guias visuais.",
        "grades": {"automation": 0, "data": 0, "ux": 2, "devops": 0, "marketing": 1},
    },
    {
        "key": "devops_engineer",
        "name": "Diego DevOps",
        "profession": "Engenheiro DevOps",
        "bio": "Engenheiro DevOps com AWS, Terraform, Kubernetes, Docker, Linux, redes, segurança e CI/CD.",
        "portfolio": "Automatizou infraestrutura, observabilidade, alertas e resposta a incidentes de serviços críticos.",
        "grades": {"automation": 1, "data": 0, "ux": 0, "devops": 3, "marketing": 0},
    },
    {
        "key": "cloud_sre",
        "name": "Nina SRE",
        "profession": "Site Reliability Engineer",
        "bio": "SRE focada em confiabilidade, cloud AWS, Kubernetes, monitoramento, SLO, incidentes e automação.",
        "portfolio": "Manteve plataformas com infraestrutura como código e pipelines de entrega contínua.",
        "grades": {"automation": 1, "data": 0, "ux": 0, "devops": 3, "marketing": 0},
    },
    {
        "key": "seo_marketer",
        "name": "Camila SEO",
        "profession": "Analista de Marketing Digital",
        "bio": "Marketing de conteúdo, SEO, palavras-chave, campanhas digitais, conversão, engajamento e redes sociais.",
        "portfolio": "Planejou calendários editoriais, acompanhou métricas e executou testes de formatos e públicos.",
        "grades": {"automation": 0, "data": 0, "ux": 0, "devops": 0, "marketing": 3},
    },
    {
        "key": "copywriter",
        "name": "Bruno Conteúdo",
        "profession": "Redator",
        "bio": "Redator para blogs, landing pages, redes sociais e campanhas, com pesquisa de pauta e adaptação de linguagem.",
        "portfolio": "Produziu textos orientados a SEO e analisou desempenho de conteúdo.",
        "grades": {"automation": 0, "data": 0, "ux": 1, "devops": 0, "marketing": 3},
    },
    {
        "key": "mobile_developer",
        "name": "Igor Mobile",
        "profession": "Desenvolvedor Mobile",
        "bio": "Desenvolvedor Flutter e Kotlin para aplicativos Android e iOS, integração de telas e publicação nas lojas.",
        "portfolio": "Criou aplicativos de atendimento com notificções e funcionamento offline.",
        "grades": {"automation": 0, "data": 0, "ux": 1, "devops": 0, "marketing": 0},
    },
    {
        "key": "hr_recruiter",
        "name": "Sofia Pessoas",
        "profession": "Analista de RH",
        "bio": "Recrutamento, seleção, entrevistas por competências, treinamento e desenvolvimento de pessoas.",
        "portfolio": "Estruturou trilhas de carreira e pesquisas de clima organizacional.",
        "grades": {"automation": 0, "data": 0, "ux": 0, "devops": 0, "marketing": 0},
    },
    {
        "key": "keyword_negation",
        "name": "Teste de Negação",
        "profession": "Iniciante",
        "bio": (
            "Não tenho experiência com Python, automação, APIs REST, SQL, testes, Git, filas, arquivos ou "
            "monitoramento de falhas; apenas copiei estas palavras da oportunidade."
        ),
        "portfolio": "Sem projetos profissionais realizados.",
        "grades": {"automation": 0, "data": 0, "ux": 0, "devops": 0, "marketing": 0},
    },
    {
        "key": "empty_profile",
        "name": "Perfil Sem Descrição",
        "profession": "Não informado",
        "bio": "",
        "portfolio": "",
        "grades": {"automation": 0, "data": 0, "ux": 0, "devops": 0, "marketing": 0},
    },
]


class ApiError(RuntimeError):
    pass


class Api:
    def __init__(self, base_url: str) -> None:
        self.base_url = base_url.rstrip("/")

    def request(
        self,
        method: str,
        path: str,
        body: dict[str, Any] | None = None,
        token: str | None = None,
    ) -> Any:
        data = json.dumps(body).encode() if body is not None else None
        headers = {"Accept": "application/json"}
        if data is not None:
            headers["Content-Type"] = "application/json"
        if token:
            headers["Authorization"] = f"Bearer {token}"
        request = urllib.request.Request(self.base_url + path, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                raw = response.read()
                return json.loads(raw) if raw else None
        except urllib.error.HTTPError as error:
            detail = error.read().decode(errors="replace")
            raise ApiError(f"{method} {path}: HTTP {error.code}: {detail}") from error


def register(api: Api, email: str, name: str) -> dict[str, Any]:
    return api.request("POST", "/auth/register", {"email": email, "password": PASSWORD, "displayName": name})


def ranks(values: list[float]) -> list[float]:
    ordered = sorted(range(len(values)), key=lambda index: values[index])
    result = [0.0] * len(values)
    cursor = 0
    while cursor < len(ordered):
        end = cursor
        while end + 1 < len(ordered) and values[ordered[end + 1]] == values[ordered[cursor]]:
            end += 1
        average_rank = (cursor + end + 2) / 2.0
        for position in range(cursor, end + 1):
            result[ordered[position]] = average_rank
        cursor = end + 1
    return result


def pearson(left: list[float], right: list[float]) -> float:
    left_mean = statistics.fmean(left)
    right_mean = statistics.fmean(right)
    numerator = sum((a - left_mean) * (b - right_mean) for a, b in zip(left, right))
    denominator = math.sqrt(
        sum((a - left_mean) ** 2 for a in left) * sum((b - right_mean) ** 2 for b in right)
    )
    return numerator / denominator if denominator else 0.0


def ndcg(grades: list[int], scores: list[float], cutoff: int) -> float:
    def dcg(ordered_grades: list[int]) -> float:
        return sum((2**grade - 1) / math.log2(index + 2) for index, grade in enumerate(ordered_grades[:cutoff]))

    actual = [grade for _, grade in sorted(zip(scores, grades), reverse=True)]
    ideal = sorted(grades, reverse=True)
    ideal_dcg = dcg(ideal)
    return dcg(actual) / ideal_dcg if ideal_dcg else 0.0


def pairwise_accuracy(grades: list[int], scores: list[float]) -> float:
    correct = 0.0
    total = 0
    for left in range(len(grades)):
        for right in range(left + 1, len(grades)):
            if grades[left] == grades[right]:
                continue
            total += 1
            expected = grades[left] > grades[right]
            observed = scores[left] > scores[right]
            if scores[left] == scores[right]:
                correct += 0.5
            elif expected == observed:
                correct += 1.0
    return correct / total if total else 0.0


def percentile(values: list[float], fraction: float) -> float:
    ordered = sorted(values)
    if not ordered:
        return 0.0
    index = min(len(ordered) - 1, max(0, math.ceil(fraction * len(ordered)) - 1))
    return ordered[index]


def evaluate(api: Api, repetitions: int, output: Path | None) -> dict[str, Any]:
    run_id = time.strftime("%Y%m%d%H%M%S") + "-" + uuid.uuid4().hex[:6]
    email_prefix = f"e2e-relevance-{run_id}"
    created_profiles: list[tuple[int, str]] = []
    created_projects: list[tuple[int, str]] = []
    accounts: list[str] = []
    profile_ids: dict[str, int] = {}
    profile_tokens: dict[str, str] = {}
    project_ids: dict[str, int] = {}
    recruiter_tokens: dict[str, str] = {}
    cleanup_errors: list[str] = []
    report: dict[str, Any] = {
        "run_id": run_id,
        "account_email_prefix": email_prefix,
        "repetitions": repetitions,
    }

    try:
        for index, profile in enumerate(PROFILES):
            email = f"{email_prefix}-candidate-{index}@example.invalid"
            account = register(api, email, profile["name"])
            token = str(account["token"])
            accounts.append(email)
            created = api.request(
                "POST",
                "/profiles",
                {
                    "fullName": profile["name"],
                    "email": email,
                    "profession": profile["profession"],
                    "educationLevel": "GRADUACAO",
                    "yearsOfExperience": 4,
                    "bio": profile["bio"],
                    "avatarUrl": "",
                },
                token,
            )
            profile_id = int(created["id"])
            created_profiles.append((profile_id, token))
            profile_ids[profile["key"]] = profile_id
            profile_tokens[profile["key"]] = token
            api.request("PATCH", "/auth/profile", {"profileId": profile_id}, token)
            if profile["portfolio"]:
                api.request(
                    "POST",
                    f"/profiles/{profile_id}/portfolio",
                    {"sourceProjectId": None, "title": "Projeto relevante", "description": profile["portfolio"]},
                    token,
                )

        for index, project in enumerate(PROJECTS):
            email = f"{email_prefix}-recruiter-{index}@example.invalid"
            account = register(api, email, f"Recrutador E2E {index + 1}")
            token = str(account["token"])
            accounts.append(email)
            recruiter_tokens[project["key"]] = token
            created = api.request(
                "POST",
                "/projects",
                {
                    "title": f"[E2E {run_id}] {project['title']}",
                    "description": project["description"],
                    "area": project["area"],
                    "ownerName": f"Recrutador E2E {index + 1}",
                    "ownerEmail": email,
                },
                token,
            )
            project_id = int(created["id"])
            created_projects.append((project_id, token))
            project_ids[project["key"]] = project_id

        data_project_id = project_ids["data"]
        api.request(
            "POST",
            f"/feed/projects/{data_project_id}/interest",
            {},
            profile_tokens["data_scientist"],
        )

        all_latencies: list[float] = []
        repeatability_max_delta = 0.0
        scenario_reports: list[dict[str, Any]] = []
        grade_scores: dict[int, list[float]] = defaultdict(list)

        for project in PROJECTS:
            key = project["key"]
            token = recruiter_tokens[key]
            project_id = project_ids[key]
            calls: list[dict[str, Any]] = []
            for _ in range(repetitions):
                started = time.perf_counter()
                response = api.request(
                    "GET",
                    f"/matches/projects/{project_id}?minScore=0&interestedOnly=false&limit=50",
                    token=token,
                )
                all_latencies.append((time.perf_counter() - started) * 1000.0)
                calls.append(response)

            first_scores = {str(item["candidate_id"]): float(item["score"]) for item in calls[0]["results"]}
            for response in calls[1:]:
                compared = {str(item["candidate_id"]): float(item["score"]) for item in response["results"]}
                for candidate_id, score in first_scores.items():
                    repeatability_max_delta = max(repeatability_max_delta, abs(score - compared[candidate_id]))

            rows: list[dict[str, Any]] = []
            for profile in PROFILES:
                score = first_scores[str(profile_ids[profile["key"]])]
                grade = int(profile["grades"][key])
                grade_scores[grade].append(score)
                rows.append({"profile": profile["key"], "grade": grade, "score": score})
            rows.sort(key=lambda row: (-row["score"], row["profile"]))
            grades = [int(row["grade"]) for row in rows]
            scores = [float(row["score"]) for row in rows]
            best_grade = max(grades)
            scenario_reports.append(
                {
                    "project": key,
                    "project_id": project_id,
                    "ndcg@5": ndcg(grades, scores, 5),
                    "ndcg@10": ndcg(grades, scores, 10),
                    "spearman": pearson(ranks([float(value) for value in grades]), ranks(scores)),
                    "pairwise_accuracy": pairwise_accuracy(grades, scores),
                    "precision@3_grade>=2": sum(row["grade"] >= 2 for row in rows[:3]) / 3.0,
                    "top1_is_max_grade": rows[0]["grade"] == best_grade,
                    "top5": rows[:5],
                    "bottom3": rows[-3:],
                    "created_candidate_ranking": rows,
                }
            )

        interested = api.request(
            "GET",
            f"/matches/projects/{data_project_id}?minScore=0&interestedOnly=true&limit=5",
            token=recruiter_tokens["data"],
        )
        expected_interested_id = str(profile_ids["data_scientist"])
        interest_ok = any(
            str(item["candidate_id"]) == expected_interested_id and item["interested"] is True
            for item in interested["results"]
        )

        minimum_score = api.request(
            "GET",
            f"/matches/projects/{data_project_id}?minScore=50&interestedOnly=false&limit=2",
            token=recruiter_tokens["data"],
        )
        minimum_score_ok = (
            int(minimum_score["limit"]) == 2
            and len(minimum_score["results"]) <= 2
            and all(float(item["score"]) >= 50.0 for item in minimum_score["results"])
        )
        limited = api.request(
            "GET",
            f"/matches/projects/{data_project_id}?minScore=0&interestedOnly=false&limit=3",
            token=recruiter_tokens["data"],
        )
        limit_ok = (
            int(limited["limit"]) == 3
            and len(limited["results"]) == 3
            and int(limited["filteredTotal"]) >= len(limited["results"])
        )

        aggregate = {
            "mean_ndcg@5": statistics.fmean(item["ndcg@5"] for item in scenario_reports),
            "mean_ndcg@10": statistics.fmean(item["ndcg@10"] for item in scenario_reports),
            "mean_spearman": statistics.fmean(item["spearman"] for item in scenario_reports),
            "mean_pairwise_accuracy": statistics.fmean(item["pairwise_accuracy"] for item in scenario_reports),
            "mean_precision@3_grade>=2": statistics.fmean(
                item["precision@3_grade>=2"] for item in scenario_reports
            ),
            "top1_accuracy": statistics.fmean(float(item["top1_is_max_grade"]) for item in scenario_reports),
            "repeatability_max_score_delta": repeatability_max_delta,
            "latency_ms_p50": statistics.median(all_latencies),
            "latency_ms_p95": percentile(all_latencies, 0.95),
            "interest_filter_ok": interest_ok,
            "minimum_score_filter_ok": minimum_score_ok,
            "limit_ok": limit_ok,
            "score_by_human_grade": {
                str(grade): {
                    "count": len(values),
                    "mean": statistics.fmean(values),
                    "min": min(values),
                    "max": max(values),
                }
                for grade, values in sorted(grade_scores.items())
            },
        }
        report.update(
            {
                "aggregate": aggregate,
                "scenarios": scenario_reports,
                "interest_response": interested,
                "minimum_score_response": minimum_score,
                "limit_response": limited,
            }
        )
    finally:
        for project_id, token in reversed(created_projects):
            try:
                api.request("DELETE", f"/projects/{project_id}", token=token)
            except Exception as error:  # noqa: BLE001 - limpeza best effort registrada no relatório
                cleanup_errors.append(f"project {project_id}: {error}")
        for profile_id, token in reversed(created_profiles):
            try:
                api.request("DELETE", f"/profiles/{profile_id}", token=token)
            except Exception as error:  # noqa: BLE001 - limpeza best effort registrada no relatório
                cleanup_errors.append(f"profile {profile_id}: {error}")
        report["temporary_accounts"] = accounts
        report["cleanup_errors"] = cleanup_errors
        if output:
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="http://localhost:8080/api")
    parser.add_argument("--repetitions", type=int, default=5)
    parser.add_argument("--output", type=Path, default=Path("/tmp/synapse-live-recommendation-eval.json"))
    args = parser.parse_args()
    if args.repetitions < 2:
        raise ValueError("Use ao menos duas repetições para validar estabilidade.")
    report = evaluate(Api(args.base_url), args.repetitions, args.output)
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
