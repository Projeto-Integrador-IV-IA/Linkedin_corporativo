# LinkedIn Corporativo

Plataforma de matching interno entre colaboradores e vagas/projetos, com recomendação assistida por Machine Learning.

O repositório usa uma arquitetura monorepo: cada equipe trabalha em uma área própria, e a integração acontece por APIs documentadas em `contracts/`.

## Arquitetura

```text
Frontend
   |
   v
API Gateway :8080
   |
   +--> Profile Service ------> profile-db
   +--> Project Service ------> project-db
   +--> Match Orchestrator ---> match-db
                                  |
                                  +--> Profile Service
                                  +--> Project Service
                                  +--> ML Engine :8000
   |
   +--> Profile Service ------> Redis (cache)
```

O frontend deve acessar apenas o API Gateway. Os demais serviços conversam pela rede interna do Docker e não são publicados no computador do desenvolvedor.

## Estrutura do repositório

```text
.
├── frontend/                 # aplicação web do gestor e colaborador
├── services/
│   ├── api-gateway/          # entrada pública da aplicação
│   ├── profile-service/      # perfis, skills e experiências
│   ├── project-service/      # projetos, vagas e requisitos
│   ├── match-orchestrator/   # orquestração do fluxo de matching
│   └── ml-engine/            # inferência Python/FastAPI
├── ml/                       # dataset, treinamento e versionamento de modelos
├── contracts/                # contratos OpenAPI e schemas entre equipes
├── docker/                   # Dockerfiles compartilhados e documentação de infra
├── docs/                     # arquitetura, funcionalidades e APIs
├── scripts/                  # scripts auxiliares de desenvolvimento
├── docker-compose.yml        # ambiente local oficial
├── .env.example              # modelo de variáveis locais
└── .gitignore
```

As regras específicas de cada área estão nos READMEs:

- [Frontend](frontend/README.md)
- [Backend e microsserviços](services/README.md)
- [Machine Learning](ml/README.md)
- [Contratos de integração](contracts/README.md)
- [Docker e infraestrutura](docker/README.md)
- [Arquitetura e decisões](docs/architecture.md)
- [Funcionalidades do MVP](docs/features.md)
- [API e fluxos de integração](docs/api.md)
- [Deploy no Dokploy](docs/deploy-dokploy.md)

## Executar localmente

Requisitos:

- Docker Engine ou Docker Desktop;
- Docker Compose v2;
- Git.

Primeira execução:

```bash
cp .env.example .env
docker compose up --build
```

Após a subida do ambiente, acesse a aplicação em `http://localhost:3000`. O
frontend usa o API Gateway em `http://localhost:8080`; os serviços internos e
os bancos PostgreSQL e o Redis permanecem na rede do Compose. Na primeira
execução, crie uma conta pela tela de login; não existem credenciais padrão.

Verificar o ambiente:

```bash
docker compose ps
curl http://localhost:8080/actuator/health
curl http://localhost:8080/health/dependencies
```

Serviços disponíveis no host:

| Serviço | Endereço | Observação |
|---|---|---|
| API Gateway | `http://localhost:8080` | única entrada pública do backend |
| Profile Service | `profile-service:8081` | acessível somente na rede Docker |
| Project Service | `project-service:8082` | acessível somente na rede Docker |
| Match Orchestrator | `match-orchestrator:8083` | acessível somente na rede Docker |
| ML Engine | `ml-engine:8000` | acessível somente na rede Docker |
| Redis | `redis:6379` | cache interno do Profile Service; não é publicado no host |

Para parar os containers sem remover os dados:

```bash
docker compose down
```

Para recriar também os bancos locais, use `docker compose down -v`. Esse comando remove os volumes e apaga os dados de desenvolvimento.

## Serviços executados pelo Compose

O MVP atual sobe todos os serviços essenciais com um único comando:

- API Gateway;
- frontend Next.js;
- Profile Service e `profile-db`;
- Project Service e `project-db`;
- Match Orchestrator e `match-db`;
- ML Engine;
- Redis, usado como cache de perfis e skills.

O Redis tem volume persistente, TTL de 60 segundos e fallback para o
PostgreSQL quando estiver indisponível. Os dados de negócio continuam nos
bancos PostgreSQL; o Redis não é a fonte de verdade.

## Regras de integração

1. O frontend chama somente o Gateway.
2. Dentro dos containers, nunca use `localhost` para chamar outro serviço; use o nome do serviço no Compose.
3. Cada microsserviço é dono do seu banco e de suas migrations.
4. Não compartilhe entidades Java, classes Python ou acesso direto ao banco entre serviços.
5. Mudanças no payload de uma API devem começar por `contracts/` e ser discutidas/revisadas pelas equipes consumidoras.
6. Treinamento e inferência são responsabilidades diferentes: `ml/` treina; `services/ml-engine/` carrega o modelo e responde às requisições.
7. Não versionar `.env`, senhas reais, `target/`, `node_modules/`, ambientes virtuais ou grandes datasets/modelos sem uma decisão explícita.

## Fluxo de branches

- `main`: protegida e pronta para entrega;
- `develop`: integração da equipe;
- branches curtas por tarefa, por exemplo `feat/profile-crud`, `feat/ml-predict` e `feat/frontend-dashboard`.

Cada alteração deve ser feita por Pull Request. Evite commits simultâneos no mesmo arquivo de infraestrutura ou contrato. A PR deve informar a issue relacionada, como testar e quais contratos foram alterados.

## Issues e roadmap

O MVP integrado já cobre o fluxo principal. O roadmap de evolução fica
organizado nas Issues do GitHub; a ordem recomendada para próximos incrementos
é:

1. substituir polling por WebSocket ou SSE;
2. mover avatars para armazenamento de objetos;
3. adicionar push/e-mail e observabilidade de notificações;
4. ampliar feedback e retreinamento do ranker;
5. criar testes automatizados de contrato e ponta a ponta;
6. adicionar métricas, tracing e políticas de produção.

Cada equipe deve conseguir executar e testar sua área isoladamente, seguindo
as documentações específicas e os contratos compartilhados.
