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
├── docs/                     # decisões e documentação de arquitetura
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

Verificar o ambiente:

```bash
docker compose ps
curl http://localhost:8080/actuator/health
```

Serviços disponíveis no host:

| Serviço | Endereço | Observação |
|---|---|---|
| API Gateway | `http://localhost:8080` | única entrada pública do backend |
| Profile Service | `profile-service:8081` | acessível somente na rede Docker |
| Project Service | `project-service:8082` | acessível somente na rede Docker |
| Match Orchestrator | `match-orchestrator:8083` | acessível somente na rede Docker |
| ML Engine | `ml-engine:8000` | acessível somente na rede Docker |

Para parar os containers sem remover os dados:

```bash
docker compose down
```

Para recriar também os bancos locais, use `docker compose down -v`. Esse comando remove os volumes e apaga os dados de desenvolvimento.

## Profiles do Docker Compose

Profiles são grupos opcionais de serviços. Os serviços essenciais não possuem profile e sobem normalmente com `docker compose up`. Serviços auxiliares só são iniciados quando o profile correspondente é ativado.

### Sem profile

Serviços essenciais do ambiente:

- API Gateway;
- Profile Service;
- Project Service;
- Match Orchestrator;
- ML Engine;
- bancos PostgreSQL.

```bash
docker compose up --build
```

### Profile `ml`

Serviços relacionados ao treinamento e ao acompanhamento dos modelos:

- MLflow;
- banco ou volume do MLflow;
- ferramentas de treinamento.

```bash
docker compose --profile ml up --build
```

### Profile `automation`

Serviços de automação e monitoramento:

- n8n;
- serviços de monitoramento.

```bash
docker compose --profile automation up
```

### Profile `debug`

Ferramentas usadas apenas para desenvolvimento e diagnóstico:

- ferramentas administrativas;
- publicação temporária das portas internas.

```bash
docker compose --profile debug up
```

É possível ativar mais de um profile ao mesmo tempo:

```bash
docker compose --profile ml --profile automation up
```

Os profiles `ml`, `automation` e `debug` serão adicionados ao Compose conforme seus serviços forem implementados. Eles não devem ser necessários para executar o MVP principal.

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

O roadmap está organizado nas Issues do GitHub. A ordem técnica recomendada é:

1. contratos e migrations;
2. serviços de perfil e projeto;
3. API Gateway;
4. ML Engine e pipeline de treinamento;
5. integração pelo Match Orchestrator;
6. frontend/dashboard;
7. feedback, retreinamento e monitoramento.

O MVP precisa validar o fluxo completo, mas cada equipe deve conseguir executar e testar sua área isoladamente.
