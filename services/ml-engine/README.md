# ML Engine

Serviço FastAPI responsável somente pela inferência do modelo de ranking. O
treinamento e a geração do artefato ficam em [`../../ml/README.md`](../../ml/README.md).

## Execução

No Compose, o serviço escuta internamente na porta `8000` e carrega o artefato
montado em `/app/models/job_ranker.joblib`.

Endpoints principais:

```http
GET  /health
POST /predict
```

O contrato da requisição e da resposta está em
[`../../contracts/openapi/ml-engine.yaml`](../../contracts/openapi/ml-engine.yaml).

## Comportamento do modelo

Na inicialização, o serviço carrega o `XGBRanker`, o transformador TF-IDF, o
calibrador e os metadados salvos no artefato. `/predict` recebe candidatos e a
vaga, calcula as features e devolve scores ordenáveis.

O score exibido pelo produto é uma porcentagem calibrada relacionada à
probabilidade histórica de candidatura. Não representa probabilidade de
contratação ou decisão automática de RH.

Se o artefato estiver ausente ou não puder ser lido, o serviço usa o fallback
determinístico implementado para o desenvolvimento e informa o estado no
healthcheck. Isso não substitui a publicação do modelo em produção.

## Separação de responsabilidades

- `ml/`: dataset, engenharia de atributos, treinamento e avaliação;
- `services/ml-engine/`: API online, validação do payload e carregamento;
- `match-orchestrator`: integração com perfil/projeto e ordenação da resposta.

O endpoint não deve treinar modelo, acessar banco de negócio ou importar
entidades Java.
