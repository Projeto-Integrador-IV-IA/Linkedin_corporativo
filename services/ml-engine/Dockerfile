# syntax=docker/dockerfile:1

FROM python:3.12-slim AS semantic-model

ARG E5_REVISION=614241f622f53c4eeff9890bdc4f31cfecc418b3
ARG E5_MODEL_SHA256=dd476dd0c2514e9b9be83aeb3853fac0763e0bdf4a71645407587d77c48a2d88
ARG E5_TOKENIZER_SHA256=0b44a9d7b51c3c62626640cda0e2c2f70fdacdc25bbbd68038369d14ebdf4c39

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /semantic \
    && curl --fail --location --retry 4 \
      "https://huggingface.co/intfloat/multilingual-e5-small/resolve/${E5_REVISION}/onnx/model_qint8_avx512_vnni.onnx" \
      --output /semantic/model.onnx \
    && curl --fail --location --retry 4 \
      "https://huggingface.co/intfloat/multilingual-e5-small/resolve/${E5_REVISION}/onnx/tokenizer.json" \
      --output /semantic/tokenizer.json \
    && echo "${E5_MODEL_SHA256}  /semantic/model.onnx" | sha256sum --check --strict \
    && echo "${E5_TOKENIZER_SHA256}  /semantic/tokenizer.json" | sha256sum --check --strict

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

RUN useradd --create-home --shell /usr/sbin/nologin appuser

COPY services/ml-engine/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY services/ml-engine/app ./app
COPY services/ml-engine/semantic-model.json /app/models/semantic-e5/metadata.json
COPY --from=semantic-model /semantic /app/models/semantic-e5
COPY ml/models /app/models

EXPOSE 8000
RUN chown -R appuser:appuser /app
USER appuser

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
