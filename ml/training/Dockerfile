FROM python:3.12-slim

WORKDIR /workspace

COPY ml/training/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt \
    && useradd --uid 1000 --create-home --shell /usr/sbin/nologin trainer

COPY ml/training/train_description_ranker.py ./train_description_ranker.py

USER trainer

ENTRYPOINT ["python", "/workspace/train_description_ranker.py"]
