# LinkedIn Corporativo

Plataforma de matching entre colaboradores e vagas internas, com arquitetura baseada em microsserviços e suporte a recomendações com IA.

## Objetivo

Facilitar a alocação de profissionais em projetos por meio de:
- cadastro de perfis e competências;
- gestão de projetos e vagas;
- recomendação automática de candidatos com score de compatibilidade.

## Arquitetura (visão geral)

- **API Gateway**: ponto único de entrada.
- **Profile Service**: gestão de colaboradores, skills e experiência.
- **Project Service**: gestão de projetos, vagas e requisitos.
- **Match Orchestrator**: consolidação de dados e orquestração do fluxo de recomendação.
- **ML Engine**: inferência do modelo de machine learning.

## Stack principal

- **Backend**: Java + Spring Boot
- **IA**: Python + FastAPI + Scikit-Learn/XGBoost
- **Banco de dados**: PostgreSQL
- **Infra local**: Docker + Docker Compose

## Ambiente local com Docker

O ambiente local sobe API Gateway, microsserviços Java, ML Engine e bancos PostgreSQL separados por domínio.

```bash
docker compose up --build
```

Endpoints úteis:

- API Gateway: http://localhost:8080
- Health do Gateway: http://localhost:8080/actuator/health
- Dependências do Gateway: http://localhost:8080/health/dependencies
- Profile Service: http://localhost:8081
- Project Service: http://localhost:8082
- Match Orchestrator: http://localhost:8083
- ML Engine: http://localhost:8000

As portas, credenciais locais e nomes dos bancos ficam centralizados em `.env`.

## Fluxo resumido de recomendação

Frontend → API Gateway → Match Orchestrator → Project Service / Profile Service → ML Engine → Match Orchestrator → API Gateway → Frontend

## Status

Repositório em estruturação inicial. Consulte as Issues do projeto para acompanhar roadmap, dependências e critérios de aceite de cada entrega.
