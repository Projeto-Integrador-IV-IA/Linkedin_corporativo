import os
import re
from pathlib import Path

import joblib
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel, Field
from sklearn.feature_extraction.text import TfidfVectorizer


app = FastAPI(title="ML Engine", version="2.0.0")
TOKEN_RE = re.compile(r"[a-z0-9+#.]+", re.IGNORECASE)


class Candidate(BaseModel):
    candidate_id: str
    profile_description: str = Field(default="", max_length=30000)


class MatchRequest(BaseModel):
    candidates: list[Candidate]
    project_description: str = Field(min_length=1, max_length=30000)


class Ranker:
    def __init__(self) -> None:
        model_path = Path(os.getenv("MODEL_PATH", "/app/models/job_ranker.joblib"))
        self.loaded = False
        self.model_path = str(model_path)
        self.model = None
        self.vectorizer = None
        if model_path.exists():
            try:
                artifact = joblib.load(model_path)
                if artifact.get("artifact_version") == "description-ranker-v2":
                    self.model = artifact["model"]
                    self.vectorizer = artifact["vectorizer"]
                    self.loaded = True
                else:
                    print(f"Artefato ignorado: {model_path} não usa o contrato description-ranker-v2.", flush=True)
            except Exception as error:  # pragma: no cover - fallback para versões incompatíveis
                print(f"Não foi possível carregar o modelo {model_path}: {error}", flush=True)

    def predict(self, payload: MatchRequest) -> list[dict[str, object]]:
        profiles = [candidate.profile_description.strip() for candidate in payload.candidates]
        project = payload.project_description.strip()

        if not payload.candidates:
            return []
        if self.loaded:
            matrix = self.features(profiles, project, self.vectorizer)
            scores = self.model.predict_proba(matrix)[:, 1] * 100.0
        else:
            corpus = [*profiles, project]
            vectorizer = TfidfVectorizer(lowercase=True, strip_accents="unicode", ngram_range=(1, 2))
            vectorizer.fit(corpus if any(corpus) else ["sem descrição"])
            scores = self.features(profiles, project, vectorizer)[:, 0] * 100.0

        results = []
        for candidate, score in zip(payload.candidates, scores):
            results.append({
                "candidate_id": candidate.candidate_id,
                "score": round(float(np.clip(score, 0.0, 100.0)), 2),
            })
        results.sort(key=lambda result: (-float(result["score"]), str(result["candidate_id"])))
        return results

    def features(self, profiles: list[str], project: str, vectorizer: TfidfVectorizer) -> np.ndarray:
        profile_vectors = vectorizer.transform(profiles)
        project_vectors = vectorizer.transform([project] * len(profiles))
        similarity = np.asarray(profile_vectors.multiply(project_vectors).sum(axis=1)).ravel()
        project_tokens = self.tokens(project)
        matrix = np.zeros((len(profiles), 4), dtype=np.float32)
        for index, profile in enumerate(profiles):
            profile_tokens = self.tokens(profile)
            union = profile_tokens | project_tokens
            intersection = profile_tokens & project_tokens
            matrix[index] = [
                float(similarity[index]),
                len(intersection) / len(union) if union else 0.0,
                float(len(profile_tokens)),
                float(len(project_tokens)),
            ]
        return matrix

    @staticmethod
    def tokens(value: str) -> set[str]:
        return {token.casefold() for token in TOKEN_RE.findall(value)}



ranker = Ranker()


@app.get("/")
def home() -> dict[str, object]:
    return {"service": "ml-engine", "status": "UP", "model_loaded": ranker.loaded}


@app.get("/health")
def health() -> dict[str, object]:
    return {"status": "UP", "model_loaded": ranker.loaded}


@app.post("/predict")
def predict(payload: MatchRequest) -> dict[str, list[dict[str, object]]]:
    return {"results": ranker.predict(payload)}
