# Deploy no Dokploy

Este procedimento publica o sistema em `https://synapse.rafixx.com` usando o
Docker Compose deste repositório.

## 1. Preparar o DNS

No provedor do domínio, crie um registro:

```text
Tipo: A
Nome: synapse
Valor: IP_PUBLICO_DO_SERVIDOR
```

Libere as portas TCP `80` e `443` no firewall do servidor. O certificado HTTPS
do Let's Encrypt só poderá ser emitido depois que o domínio apontar para o
servidor e estiver acessível.

## 2. Criar a aplicação

No Dokploy:

1. Crie um projeto novo.
2. Adicione uma aplicação **Docker Compose**, não Docker Stack.
3. Conecte o repositório Git.
4. Use a raiz do repositório como diretório e
   `docker-compose.yml` como arquivo Compose.
5. Mantenha o build habilitado, pois o Compose compila o frontend, os serviços
   Java e o ML Engine.

O arquivo atual usa `build`, portanto o modo Docker Compose é o adequado. O
modo Stack exige imagens previamente publicadas em um registry.

## 3. Variáveis do ambiente

Na aba **Environment** do Dokploy, configure ao menos:

```dotenv
COMPOSE_PROJECT_NAME=synapse

API_GATEWAY_PORT=8080
PROFILE_SERVICE_PORT=8081
PROJECT_SERVICE_PORT=8082
MATCH_ORCHESTRATOR_PORT=8083
ML_ENGINE_PORT=8000
NEXT_PUBLIC_API_BASE_URL=/api

POSTGRES_VERSION=16-alpine
POSTGRES_PROFILE_DB=profile_service
POSTGRES_PROFILE_USER=profile_user
POSTGRES_PROFILE_PASSWORD=UMA_SENHA_FORTE_E_UNICA
POSTGRES_PROJECT_DB=project_service
POSTGRES_PROJECT_USER=project_user
POSTGRES_PROJECT_PASSWORD=UMA_SENHA_FORTE_E_UNICA
POSTGRES_MATCH_DB=match_orchestrator
POSTGRES_MATCH_USER=match_user
POSTGRES_MATCH_PASSWORD=UMA_SENHA_FORTE_E_UNICA

REDIS_VERSION=7-alpine
REDIS_PORT=6379
```

Não use as senhas de desenvolvimento do `.env` nem deixe
`NEXT_PUBLIC_API_BASE_URL` apontando para `localhost`. O valor `/api` faz o
frontend chamar o Gateway no mesmo domínio público.

O Dokploy grava as variáveis do Compose em um `.env` da implantação. Neste
repositório, os serviços que precisam de todas as variáveis usam `env_file`, e
o frontend recebe a URL pública durante o build pelo argumento
`NEXT_PUBLIC_API_BASE_URL`.

## 4. Configurar os domínios

Na aba **Domains** da aplicação Compose, crie duas regras HTTPS:

| Serviço | Host | Path | Porta do container | HTTPS |
|---|---|---|---:|---|
| `frontend` | `synapse.rafixx.com` | `/` | `3000` | Let's Encrypt |
| `api-gateway` | `synapse.rafixx.com` | `/api` | `8080` | Let's Encrypt |

Na regra do Gateway, mantenha o caminho `/api` chegando ao serviço, sem
remover o prefixo (`Strip Path` desativado). O Gateway já possui rotas como
`/api/auth/login` e `/api/projects`.

O Dokploy gera internamente a configuração do Traefik a partir da aba de
domínios; não é necessário adicionar labels Traefik manualmente. Depois de
alterar o domínio, faça um novo deploy para a aplicação Compose.

## 5. Deploy e validação

Clique em **Deploy** e acompanhe os logs dos serviços. Após a conclusão,
verifique:

```bash
curl -I https://synapse.rafixx.com
curl -i https://synapse.rafixx.com/api/auth/me
```

O segundo comando deve chegar ao Gateway e responder `401`/`403` sem token;
isso confirma que o caminho `/api` foi roteado para o backend. Os healthchecks
detalhados continuam disponíveis nos logs/monitoramento do serviço Gateway no
Dokploy. Depois, abra o domínio no navegador, crie uma conta e teste perfil,
projeto, recomendação e chat.

## 6. Persistência e backups

O Compose declara volumes nomeados para `profile-db`, `project-db`, `match-db`
e Redis. Não remova esses volumes ao redeployar. Configure backups dos volumes
nomeados no Dokploy antes de usar o ambiente com dados reais.

O arquivo `ml/models/job_ranker.joblib` precisa estar versionado ou disponível
no contexto de build, porque o Dockerfile do ML Engine copia esse artefato para
a imagem.

## 7. Atualizações

Após cada alteração no Git:

1. faça push para a branch configurada no Dokploy;
2. dispare o deploy automático ou manual;
3. confirme os healthchecks;
4. valide o frontend e o login antes de considerar a versão publicada.

Referências oficiais: [Docker Compose no Dokploy](https://docs.dokploy.com/docs/core/docker-compose),
[domínios para Docker Compose](https://docs.dokploy.com/docs/core/docker-compose/domains)
e [gerenciamento de domínios](https://docs.dokploy.com/docs/core/domains).
