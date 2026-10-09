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

- **Frontend**: autenticação, perfil, projetos, recomendações, chats, feed de
  oportunidades e dashboard administrativo de LLM. Usa
  polling de dois segundos para atualizar mensagens e contadores.
- **API Gateway**: ponto de entrada público, proxy para os serviços, CORS e
  healthcheck de dependências.
- **Profile Service**: perfis, foto/avatar, descrições profissionais e portfólio.
- **Project Service**: usuários, sessões, projetos, decisões, chats, mensagens
  e notas particulares. Também mantém as sessões do assistente LLM, chama o
  provedor configurado (Gemini ou NVIDIA) sem expor a credencial e agrega a
  telemetria de tokens para administradores.
- **Match Orchestrator**: integra dados de perfil e projeto e solicita scores
  ao ML Engine.
- **ML Engine**: carrega o ranker textual v2 e responde à inferência.
- **Redis**: cache de perfis com TTL de 60 segundos e fallback para
  PostgreSQL.

## Donos dos dados

| Banco | Dono | Dados |
|---|---|---|
| `profile-db` | Profile Service | perfis, avatar, descrições e portfólio |
| `project-db` | Project Service | usuários, sessões, projetos, telemetria LLM, decisões, chats, mensagens e notas |
| `match-db` | Match Orchestrator | dados auxiliares/resultados de matching |

Cada serviço é dono das próprias tabelas. O Match Orchestrator usa HTTP para
consultar os serviços de domínio, sem acessar diretamente seus bancos.

## Autenticação e autorização

O usuário autentica no Project Service por meio do Gateway. O frontend guarda
o token Bearer na sessão local e o envia nas chamadas seguintes. O interceptor
do Project Service identifica o usuário e as operações de projeto verificam o
`ownerId`. Assim, um recrutador só gerencia projetos próprios.

O papel `ADMIN` é provisionado por segredo de ambiente, não pelo cadastro
público. O endpoint agregado de métricas valida esse papel no Project Service,
mesmo que alguém tente acessá-lo diretamente pelo Gateway.

As mensagens pertencem a uma conversa com dois participantes. A nota é
associada ao recrutador que a criou e nunca é retornada ao outro participante.

## Fluxo de recomendação

1. O usuário abre um projeto próprio.
2. O Match Orchestrator consulta a descrição do projeto, a bio e as descrições
   do portfólio de todos os profissionais.
3. O payload exclusivamente textual é enviado ao ML Engine conforme o contrato OpenAPI.
4. O ranker retorna scores ordenáveis.
5. O orquestrador aplica o bônus configurável aos perfis que demonstraram
   interesse e reordena o resultado, sem alterar o modelo textual.
6. A interface exibe o score final, o score textual e o bônus de interesse.
7. Aceitar/rejeitar grava uma decisão no Project Service; rejeitados são
   ocultados da lista ativa, mas permanecem no histórico.

O score representa compatibilidade textual entre as descrições. Não é decisão
de contratação nem previsão garantida de desempenho. O score final pode incluir
o bônus explícito de interesse, limitado a 100 pontos.

## Fluxo de interesse

O Project Service mantém uma relação única entre conta profissional e projeto.
O endpoint do feed monta um DTO sanitizado com apenas a contagem agregada e o
estado da própria sessão. A visão interna do projeto continua disponível ao
Match Orchestrator para identificar os IDs de perfil que receberão o bônus.

## Assistentes de escrita

Os contextos de vaga, perfil geral e portfólio usam o mesmo fluxo seguro no
Project Service. O serviço persiste o proprietário, o contador de versões e o
fim da janela de uso. A primeira rodada pode fazer até cinco perguntas; as
seguintes fazem até três e duas. Após três reformulações, continuar com a IA é
bloqueado. Uma nova sessão só pode começar depois de 24 horas.

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
