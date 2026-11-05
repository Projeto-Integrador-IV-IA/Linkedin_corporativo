import os
import re
from pathlib import Path

import joblib
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel, Field
from sklearn.feature_extraction.text import HashingVectorizer


app = FastAPI(title="ML Engine", version="3.0.0")
TOKEN_RE = re.compile(r"[a-z0-9+#.]+", re.IGNORECASE)
EXPECTED_FEATURES = ["text_similarity", "token_jaccard", "profile_word_count", "project_word_count"]


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
        self.artifact_version = None
        self.trained_at = None
        self.score_semantics = None
        if model_path.exists():
            try:
                artifact = joblib.load(model_path)
                if (
                    artifact.get("artifact_version") == "description-ranker-v3"
                    and artifact.get("feature_names") == EXPECTED_FEATURES
                ):
                    self.model = artifact["model"]
                    self.vectorizer = artifact["vectorizer"]
                    self.artifact_version = artifact["artifact_version"]
                    self.trained_at = artifact.get("trained_at")
                    self.score_semantics = artifact.get("score_semantics")
                    self.loaded = True
                else:
                    print(
                        f"Artefato ignorado: {model_path} não usa o contrato completo description-ranker-v3.",
                        flush=True,
                    )
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
            vectorizer = HashingVectorizer(
                lowercase=True,
                strip_accents="unicode",
                analyzer="char_wb",
                ngram_range=(3, 5),
                n_features=2**18,
                alternate_sign=False,
                norm="l2",
            )
            scores = self.features(profiles, project, vectorizer)[:, 0] * 100.0

        # Sem texto não existe evidência de aderência. A taxa-base aprendida
        # pelo classificador não deve aparecer ao usuário como compatibilidade.
        scores = np.where(np.asarray([bool(profile) for profile in profiles]), scores, 0.0)

        results = []
        for candidate, score in zip(payload.candidates, scores):
            results.append({
                "candidate_id": candidate.candidate_id,
                "score": round(float(np.clip(score, 0.0, 100.0)), 2),
            })
        results.sort(key=lambda result: (-float(result["score"]), str(result["candidate_id"])))
        return results

    def features(self, profiles: list[str], project: str, vectorizer: HashingVectorizer) -> np.ndarray:
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
    return {"service": "ml-engine", **health()}


@app.get("/health")
def health() -> dict[str, object]:
    return {
        "status": "UP",
        "model_loaded": ranker.loaded,
        "artifact_version": ranker.artifact_version,
        "trained_at": ranker.trained_at,
        "score_semantics": ranker.score_semantics,
    }


@app.post("/predict")
def predict(payload: MatchRequest) -> dict[str, list[dict[str, object]]]:
    return {"results": ranker.predict(payload)}
