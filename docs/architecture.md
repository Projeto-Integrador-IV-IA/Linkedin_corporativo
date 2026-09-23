# Arquitetura atual

## Visão geral

```text
Browser / Next.js
        |
        v
API Gateway :8080
   |       |             |
   v       v             v
Profile  Project     Match Orchestrator ---> ML Engine :8000
Service  Service          |       |
   |       |              |       +--> Profile Service
   |       |              +----------> Project Service
   v       v
profile-db project-db
   |
 Redis (cache)
```

O frontend chama somente o Gateway. Os demais serviços conversam pela rede
interna do Compose. PostgreSQL guarda os dados de negócio; Redis acelera
consultas do Profile Service, mas não é fonte de verdade.

## Componentes

- **Frontend**: autenticação, perfil, projetos, recomendações e chats. Usa
  polling de dois segundos para atualizar mensagens e contadores.
- **API Gateway**: ponto de entrada público, proxy para os serviços, CORS e
  healthcheck de dependências.
- **Profile Service**: perfis, foto/avatar, skills e portfólio.
- **Project Service**: usuários, sessões, projetos, decisões, chats, mensagens
  e notas particulares.
- **Match Orchestrator**: integra dados de perfil e projeto e solicita scores
  ao ML Engine.
- **ML Engine**: carrega o `XGBRanker` treinado e responde à inferência.
- **Redis**: cache de perfis e skills com TTL de 60 segundos e fallback para
  PostgreSQL.

## Donos dos dados

| Banco | Dono | Dados |
|---|---|---|
| `profile-db` | Profile Service | perfis, avatar, skills e portfólio |
| `project-db` | Project Service | usuários, tokens, projetos, decisões, chats, mensagens e notas |
| `match-db` | Match Orchestrator | dados auxiliares/resultados de matching |

Cada serviço é dono das próprias tabelas. O Match Orchestrator usa HTTP para
consultar os serviços de domínio, sem acessar diretamente seus bancos.

## Autenticação e autorização

O usuário autentica no Project Service por meio do Gateway. O frontend guarda
o token Bearer na sessão local e o envia nas chamadas seguintes. O interceptor
do Project Service identifica o usuário e as operações de projeto verificam o
`ownerId`. Assim, um recrutador só gerencia projetos próprios.

As mensagens pertencem a uma conversa com dois participantes. A nota é
associada ao recrutador que a criou e nunca é retornada ao outro participante.

## Fluxo de recomendação

1. O usuário abre um projeto próprio.
2. O Match Orchestrator consulta perfil, projeto e requisitos.
3. O payload é enviado ao ML Engine conforme o contrato OpenAPI.
4. O ranker retorna scores ordenáveis.
5. A interface exibe os candidatos com porcentagem de correspondência.
6. Aceitar/rejeitar grava uma decisão no Project Service; rejeitados são
   ocultados da lista ativa, mas permanecem no histórico.

O score é calibrado a partir de candidatura histórica. Não é decisão de
contratação nem previsão garantida de desempenho.

## Cache e disponibilidade

O Redis é habilitado no Profile Service com `@Cacheable` para leituras e
invalidação nas mutações. O tratamento de erro do cache permite que falhas do
Redis retornem ao PostgreSQL com pequena latência adicional. O Compose mantém
um volume para o Redis, mas o dado pode ser reconstruído a qualquer momento.

## Decisões e limites do MVP

- Polling foi usado no chat para evitar uma dependência de WebSocket no MVP.
- O som usa Web Audio e só é ativado após interação do navegador.
- Fotos são `data URL` em coluna `TEXT`; em produção, migrar para object
  storage e salvar apenas a URL.
- O modelo é treinado offline em `ml/`; inferência não dispara treinamento.

## Isolamento para trabalho paralelo

- frontend: `frontend/`;
- backend: `services/`;
- ML: `ml/` e `services/ml-engine/`;
- contratos: `contracts/`;
- infraestrutura: `docker/`, `docker-compose.yml` e `.env.example`.

Mudanças de payload devem ser documentadas nos contratos antes de alterar os
produtores e consumidores.
