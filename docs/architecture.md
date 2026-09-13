# Decisões de arquitetura

## Monorepo

O projeto permanece em um único repositório porque o MVP possui um fluxo ponta a ponta que atravessa frontend, Gateway, serviços Java e ML Engine. O isolamento acontece por diretórios, contratos, bancos e imagens, não por cópia de código.

## Donos dos dados

| Banco | Dono | Dados |
|---|---|---|
| `profile-db` | Profile Service | perfis, skills e experiências |
| `project-db` | Project Service | projetos, vagas e requisitos |
| `match-db` | Match Orchestrator | solicitações, resultados e feedback do matching |

Nenhum serviço consulta tabelas de outro serviço.

## Fronteira Java/Python

O Match Orchestrator consulta os serviços de domínio, monta o payload definido em `contracts/openapi/ml-engine.yaml` e chama o ML Engine. O ML Engine não conhece entidades Java e não treina modelos durante uma requisição.

## Trabalho paralelo

As equipes podem trabalhar em paralelo quando respeitarem os limites abaixo:

- frontend: `frontend/`;
- backend: `services/`;
- ML: `ml/` e `services/ml-engine/`;
- contratos: `contracts/`;
- infraestrutura: `docker/`, `docker-compose.yml` e arquivos de ambiente de exemplo.

Arquivos compartilhados devem ser alterados por PR e revisados pelas equipes impactadas.
