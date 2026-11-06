# ML Engine

Serviço FastAPI responsável somente pela inferência do modelo de ranking. O
treinamento e a geração do artefato ficam em [`../../ml/README.md`](../../ml/README.md).

## Execução

No Compose, o serviço escuta internamente na porta `8000`, carrega o artefato
lexical em `/app/models/job_ranker.joblib` e o encoder semântico ONNX em
`/app/models/semantic-e5/`.

Endpoints principais:

```http
GET  /health
POST /predict
```

O contrato da requisição e da resposta está em
[`../../contracts/openapi/ml-engine.yaml`](../../contracts/openapi/ml-engine.yaml).

## Comportamento do modelo

Na inicialização, o serviço carrega o componente lexical
`description-ranker-v3` e o `intfloat/multilingual-e5-small` em ONNX. O runtime
`hybrid-semantic-ranker-v4` combina os dois sinais. `/predict` recebe
`project_description` e uma lista de `profile_description`, calcula o índice
de aderência e devolve todos os candidatos ordenados.

O score exibido pelo produto é um índice de aderência de 0 a 100 pontos. Não
representa probabilidade de contratação ou decisão automática de RH.

No ambiente Compose, `REQUIRE_SEMANTIC_MODEL=true`: se qualquer componente não
puder ser carregado, `/health` e `/predict` respondem 503. O fallback
determinístico existe apenas para testes unitários e não é aceito como estado
pronto em produção.

## Separação de responsabilidades

- `ml/`: dataset, engenharia de atributos, treinamento e avaliação;
- `services/ml-engine/`: API online, validação do payload e carregamento;
- `match-orchestrator`: integração com perfil/projeto e ordenação da resposta.

O endpoint não deve treinar modelo, acessar banco de negócio ou importar
entidades Java.
