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
| `POST` | `/auth/register` | cria uma conta de membro; recebe `email`, `password` e `displayName` |
| `POST` | `/auth/login` | autentica e retorna token e usuário |
| `POST` | `/auth/password-reset/request` | inicia a recuperação de senha por e-mail |
| `POST` | `/auth/password-reset/confirm` | redefine a senha com o token recebido no e-mail |
| `POST` | `/auth/change-password` | troca a senha da sessão autenticada; requer senha atual |
| `GET` | `/auth/me` | retorna a sessão do token atual |
| `PATCH` | `/auth/profile` | atualiza nome e dados básicos do usuário |

A senha deve ter ao menos seis caracteres. Exemplo de cadastro:

```json
{
  "email": "ana@exemplo.com",
  "password": "senha-segura",
  "displayName": "Ana"
}
```

Todo cadastro público cria uma conta de membro, que pode tanto manter um perfil
quanto publicar projetos. O papel `ADMIN` não pode ser escolhido no cadastro
público; a conta administrativa é criada ou atualizada na inicialização com
`ADMIN_EMAIL`, `ADMIN_PASSWORD` e `ADMIN_DISPLAY_NAME` no ambiente do Project
Service.

`POST /auth/password-reset/request` recebe `{ "email": "..." }` e sempre
responde de forma genérica para não expor se o endereço possui conta. Para uma
conta existente, envia um link de uso único que expira em 30 minutos por padrão.
`POST /auth/password-reset/confirm` recebe `token` e `newPassword`; a nova senha
deve ter pelo menos 8 caracteres e invalida a sessão anterior. A troca autenticada
recebe `currentPassword` e `newPassword`, rotaciona o token da sessão e devolve o
usuário atualizado.

O SMTP usa `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`,
`MAIL_SMTP_AUTH`, `MAIL_SMTP_STARTTLS` e `MAIL_FROM`. O Compose traz Mailpit em
`http://localhost:8025` como caixa de e-mail de desenvolvimento. Em produção,
configure essas variáveis com o servidor SMTP e `APP_PUBLIC_URL` com a URL pública
da aplicação.

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
GET /matches/projects/{projectId}?minScore=50&interestedOnly=true&limit=10
```

Retorna a lista ordenada de recomendações. Os parâmetros opcionais permitem
definir a aderência mínima de `0` a `100`, restringir o resultado a quem
demonstrou interesse e limitar a quantidade retornada. O limite padrão é `10`,
aceita valores entre `1` e `50` e é aplicado depois da ordenação. A resposta
inclui `totalResults`, `filteredTotal`, `limit` e `results` para diferenciar o
total avaliado, o total que atende aos filtros e a parcela efetivamente retornada.

O ranker híbrido v4 recebe somente a descrição da vaga e, para cada candidato, a bio concatenada
às descrições dos projetos do portfólio. Skills, profissão, escolaridade e
tempo de experiência não são features independentes. Ele combina o ranker
lexical v3 com similaridade semântica multilíngue E5. O valor de `score` é um
índice em pontos de `0` a `100`, não uma probabilidade de contratação.
Rejeitados não
aparecem na lista ativa; o histórico continua disponível pela API de decisões.

O Match Orchestrator consulta os serviços de projeto e perfil e chama o ML
Engine pela rede interna. A rota de inferência do ML Engine é definida em
[`../contracts/openapi/ml-engine.yaml`](../contracts/openapi/ml-engine.yaml).
Após receber a compatibilidade textual, o orquestrador preserva o score e a
ordenação produzidos pelo ML Engine e então aplica os filtros e o limite. Cada
item da resposta expõe `score` e `interested`;
o segundo campo é apenas informativo e não participa do cálculo.

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
