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

O papel `ADMIN` não pode ser escolhido no cadastro público. A conta administrativa
é criada ou atualizada na inicialização com `ADMIN_EMAIL`, `ADMIN_PASSWORD` e
`ADMIN_DISPLAY_NAME` no ambiente do Project Service.

## Métricas administrativas de LLM

```http
GET /admin/metrics?days=30
```

A rota aceita uma janela entre 1 e 365 dias e exige uma sessão com papel
`ADMIN`. Ela retorna tokens de entrada, saída, contexto em cache, raciocínio e
total; chamadas concluídas e com erro; latência; usuários únicos; série diária;
agrupamentos por contexto, operação, provedor/modelo; custo estimado e projeção
linear do mês atual. Nenhuma descrição ou prompt é salvo na tabela de métricas.

Os preços por milhão de tokens são definidos por
`LLM_INPUT_COST_PER_MILLION` e `LLM_OUTPUT_COST_PER_MILLION`. Tokens de
contexto em cache e de raciocínio continuam como métricas operacionais, mas
não possuem custos separados. Enquanto os preços estiverem em zero, o painel mantém
as métricas de volume e desempenho e sinaliza que a estimativa monetária não
foi configurada.

## Perfis

| Método | Rota | Uso |
|---|---|---|
| `GET` | `/profiles` | lista perfis para matching e consulta |
| `GET` | `/profiles/{id}` | consulta um perfil |
| `POST` | `/profiles` | cria perfil |
| `PUT` | `/profiles/{id}` | substitui/atualiza perfil |
| `DELETE` | `/profiles/{id}` | remove perfil |
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

## Feed e manifestação de interesse

| Método | Rota | Uso |
|---|---|---|
| `GET` | `/feed/projects` | lista todos os projetos abertos para profissionais e recrutadores |
| `POST` | `/feed/projects/{id}/interest` | demonstra interesse no projeto |
| `DELETE` | `/feed/projects/{id}/interest` | retira o interesse |

O feed pode ser consultado por contas `CANDIDATE`, `RECRUITER` e `MANAGER`.
Qualquer uma dessas contas com perfil salvo pode manifestar ou retirar interesse,
exceto no projeto do qual é responsável. A resposta inclui o nome e o avatar público
do responsável (`ownerName` e `ownerAvatarUrl`), a contagem agregada `interestedCount` e o booleano `interested`,
referente apenas ao usuário autenticado. Ela não retorna nomes, e-mails, IDs de perfil nem a lista
de interessados. Para manifestar interesse, a conta precisa ter um perfil
salvo e associado.

## Matching

```http
GET /matches/projects/{projectId}
```

Retorna a lista ordenada de recomendações, com dados resumidos do profissional,
`matchScore`/porcentagem de correspondência e estado da decisão. O modelo v2
recebe somente a descrição da vaga e, para cada candidato, a bio concatenada
às descrições dos projetos do portfólio. Skills, profissão, escolaridade e
tempo de experiência não são features independentes. Rejeitados não
aparecem na lista ativa; o histórico continua disponível pela API de decisões.

O Match Orchestrator consulta os serviços de projeto e perfil e chama o ML
Engine pela rede interna. A rota de inferência do ML Engine é definida em
[`../contracts/openapi/ml-engine.yaml`](../contracts/openapi/ml-engine.yaml).
Após receber a compatibilidade textual, o orquestrador acrescenta o bônus
configurado por `MATCH_INTEREST_BOOST_POINTS` aos profissionais que demonstraram
interesse, limita o score final a 100 e reordena o resultado. A resposta expõe
`text_score`, `interest_boost`, `interested` e o `score` final para tornar o
critério auditável. O valor padrão é 10 pontos e não altera as features do
modelo enquanto o novo treinamento não é realizado.

## Assistente de descrições com LLM

As rotas abaixo são autenticadas e encaminhadas pelo Gateway ao Project
Service. A chave do provedor nunca é enviada ao navegador.

| Método | Rota | Uso |
|---|---|---|
| `POST` | `/ai/descriptions/sessions` | inicia a janela de 24 horas e gera perguntas |
| `POST` | `/ai/descriptions/sessions/{id}/generate` | usa as respostas para gerar uma versão |
| `POST` | `/ai/descriptions/sessions/{id}/continue` | gera uma rodada menor de perguntas |
| `POST` | `/ai/descriptions/sessions/{id}/finish` | aceita ou aplica a edição humana |

`contextType` aceita `VACANCY`, `PROFILE` e `PORTFOLIO`. Cada conta pode abrir
uma sessão de vaga e uma sessão compartilhada entre perfil/portfólio por janela
de 24 horas. A sessão permite no máximo três versões; na
terceira, as únicas ações são aceitar ou editar. O texto nunca é gravado no
perfil ou na vaga sem confirmação no formulário.

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
