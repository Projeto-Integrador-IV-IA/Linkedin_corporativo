# API e fluxos de integração

## Convenções

Durante o desenvolvimento, o endereço público é:

```text
http://localhost:8080/api
```

O frontend chama somente o API Gateway. Todas as rotas protegidas recebem:

```http
Authorization: Bearer <token>
```

Os serviços internos usam os nomes do Docker Compose e não devem ser chamados
diretamente pelo navegador.

## Autenticação

| Método | Rota | Uso |
|---|---|---|
| `POST` | `/auth/register` | cria conta; recebe `email`, `password`, `displayName` e `role` |
| `POST` | `/auth/login` | autentica e retorna token e usuário |
| `GET` | `/auth/me` | retorna a sessão do token atual |
| `PATCH` | `/auth/profile` | atualiza nome e dados básicos do usuário |

A senha deve ter ao menos seis caracteres. Exemplo de cadastro:

```json
{
  "email": "recrutador@empresa.com",
  "password": "senha-segura",
  "displayName": "Ana Recrutadora",
  "role": "RECRUITER"
}
```

## Perfis

| Método | Rota | Uso |
|---|---|---|
| `GET` | `/profiles` | lista perfis para matching e consulta |
| `GET` | `/profiles/{id}` | consulta um perfil |
| `POST` | `/profiles` | cria perfil |
| `PUT` | `/profiles/{id}` | substitui/atualiza perfil |
| `DELETE` | `/profiles/{id}` | remove perfil |
| `GET` | `/skills` | lista skills disponíveis |
| `POST` | `/profiles/{id}/skills` | adiciona skill ao perfil |
| `DELETE` | `/profiles/{id}/skills/{skillId}` | remove skill |
| `POST` | `/profiles/{id}/portfolio` | adiciona item ao portfólio |

O payload de perfil aceita `avatarUrl`. No MVP, essa propriedade é uma `data
URL` de imagem e não deve exceder aproximadamente 700 mil caracteres no
backend; o frontend restringe o arquivo original a 512 KB.

## Projetos e decisões

| Método | Rota | Uso |
|---|---|---|
| `GET` | `/projects` | lista os projetos do usuário autenticado |
| `POST` | `/projects` | cria projeto do usuário autenticado |
| `GET` | `/projects/{id}` | consulta detalhes de projeto próprio |
| `PUT` | `/projects/{id}` | edita projeto próprio |
| `PATCH` | `/projects/{id}/status` | altera status do projeto |
| `DELETE` | `/projects/{id}` | exclui projeto próprio |
| `POST` | `/projects/{id}/applications` | registra candidatura associada |
| `PATCH` | `/projects/{id}/applications/{applicationId}/status` | atualiza status de candidatura |
| `GET` | `/projects/{id}/candidate-decisions` | consulta histórico de decisões |
| `POST` | `/projects/{id}/candidate-decisions/{profileId}` | aceita, rejeita ou reabre candidato |

O serviço valida o proprietário em todas as operações de projeto. Os valores
de decisão usados pela interface são `ACEITO`, `REJEITADO` e `PENDENTE`.

## Matching

```http
GET /matches/projects/{projectId}
```

Retorna a lista ordenada de recomendações, com dados resumidos do profissional,
`matchScore`/porcentagem de correspondência e estado da decisão. Rejeitados não
aparecem na lista ativa; o histórico continua disponível pela API de decisões.

O Match Orchestrator consulta os serviços de projeto e perfil e chama o ML
Engine pela rede interna. A rota de inferência do ML Engine é definida em
[`../contracts/openapi/ml-engine.yaml`](../contracts/openapi/ml-engine.yaml).

## Conversas, mensagens e notas

| Método | Rota | Uso |
|---|---|---|
| `GET` | `/chats` | lista conversas do usuário, com não lidas |
| `POST` | `/chats` | cria ou recupera conversa com profissional |
| `GET` | `/chats/{chatId}/messages` | lista mensagens persistidas |
| `POST` | `/chats/{chatId}/messages` | envia mensagem |
| `GET` | `/chats/{chatId}/note` | lê nota particular do recrutador |
| `PUT` | `/chats/{chatId}/note` | cria/atualiza nota particular |

As mensagens e notas são armazenadas no Project Service. O usuário só pode
acessar conversas das quais participa; a nota é filtrada pelo recrutador que a
criou.

## Saúde

```http
GET /actuator/health
GET /health/dependencies
```

O primeiro verifica o Gateway. O segundo verifica as dependências internas
principais, incluindo serviços de domínio e ML Engine.
