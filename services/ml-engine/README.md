# ML Engine

Serviço Python/FastAPI responsável somente por carregar um modelo e executar inferência.

O treinamento, a geração do dataset e a avaliação ficam em [`../../ml/README.md`](../../ml/README.md). Não colocar notebooks ou scripts de treinamento dentro da imagem de produção do serviço.

## Contrato

O contrato inicial está em [`../../contracts/openapi/ml-engine.yaml`](../../contracts/openapi/ml-engine.yaml). O endpoint de predição deve receber múltiplos candidatos, retornar resultados ordenados e usar score de `0` a `100`.

## Execução local

```bash
cd services/ml-engine
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Dentro do Compose, o serviço é acessado por `http://ml-engine:8000` e não possui porta publicada no host por padrão.

## Regras

- Manter o healthcheck em `/health`.
- Validar payloads com modelos Pydantic.
- Não acessar os bancos PostgreSQL diretamente.
- Não colocar credenciais ou modelos grandes no Git sem decisão documentada.
- Adicionar testes para cada alteração do contrato de predição.
