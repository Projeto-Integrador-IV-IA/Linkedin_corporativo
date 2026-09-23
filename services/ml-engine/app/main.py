import os
import re
from pathlib import Path

import joblib
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel, Field


app = FastAPI(title="ML Engine", version="1.0.0")
TOKEN_RE = re.compile(r"[a-z0-9+#.]+", re.IGNORECASE)


class Candidate(BaseModel):
    candidate_id: str
    skills: list[str] = Field(default_factory=list)
    profession: str = ""
    years_experience: int = 0


class MatchRequest(BaseModel):
    candidates: list[Candidate]
    required_skills: list[str] = Field(default_factory=list)
    required_title: str = ""


class Ranker:
    def __init__(self) -> None:
        model_path = Path(os.getenv("MODEL_PATH", "/app/models/job_ranker.joblib"))
        self.loaded = False
        self.model_path = str(model_path)
        self.model = None
        self.calibrator = None
        self.vectorizer = None
        if model_path.exists():
            try:
                artifact = joblib.load(model_path)
                self.model = artifact["model"]
                self.calibrator = artifact["calibrator"]
                self.vectorizer = artifact["vectorizer"]
                self.loaded = True
            except Exception as error:  # pragma: no cover - fallback para versões incompatíveis
                print(f"Não foi possível carregar o modelo {model_path}: {error}", flush=True)

    def predict(self, payload: MatchRequest) -> list[dict[str, object]]:
        required = [skill.strip() for skill in payload.required_skills if skill.strip()]
        required_keys = {self.normalize(skill) for skill in required}
        profiles = [self.profile_text(candidate) for candidate in payload.candidates]
        job = " ".join([payload.required_title, *required]).strip()

        if self.loaded:
            matrix = self.features(payload.candidates, profiles, job, payload.required_title)
            raw_scores = np.asarray(self.model.predict(matrix), dtype=float)
            scores = self.calibrator.predict_proba(raw_scores.reshape(-1, 1))[:, 1] * 100.0
        else:
            scores = np.array([
                100.0 * self.overlap(candidate, required_keys) / len(required_keys) if required_keys else 0.0
                for candidate in payload.candidates
            ])

        results = []
        for candidate, score in zip(payload.candidates, scores):
            candidate_keys = {self.normalize(skill) for skill in candidate.skills}
            matched = [skill for skill in required if self.normalize(skill) in candidate_keys]
            gaps = [skill for skill in required if self.normalize(skill) not in candidate_keys]
            results.append({
                "candidate_id": candidate.candidate_id,
                "score": round(float(np.clip(score, 0.0, 100.0)), 2),
                "matched_skills": matched,
                "skill_gaps": gaps,
            })
        results.sort(key=lambda result: (-float(result["score"]), str(result["candidate_id"])))
        return results

    def features(self, candidates: list[Candidate], profiles: list[str], job: str, title: str) -> np.ndarray:
        profile_vectors = self.vectorizer.transform(profiles)
        job_vectors = self.vectorizer.transform([job] * len(candidates))
        similarity = np.asarray(profile_vectors.multiply(job_vectors).sum(axis=1)).ravel()
        job_tokens = self.tokens(job)
        matrix = np.zeros((len(candidates), 12), dtype=np.float32)
        for index, (candidate, profile) in enumerate(zip(candidates, profiles)):
            profile_tokens = self.tokens(profile)
            union = profile_tokens | job_tokens
            intersection = profile_tokens & job_tokens
            matrix[index] = [
                float(similarity[index]),
                len(intersection) / len(union) if union else 0.0,
                0.0,  # localização não faz parte do payload atual
                0.0,
                0.0,
                float(candidate.years_experience),
                0.0,
                0.0,
                float(len(profile_tokens)),
                float(len(self.tokens(title))),
                float(len(job_tokens)),
                float(bool(profile_tokens)),
            ]
        return matrix

    @staticmethod
    def profile_text(candidate: Candidate) -> str:
        return " ".join([candidate.profession, *candidate.skills]).strip()

    @staticmethod
    def normalize(value: str) -> str:
        return " ".join(value.casefold().split())

    @staticmethod
    def tokens(value: str) -> set[str]:
        return {token.casefold() for token in TOKEN_RE.findall(value)}

    @staticmethod
    def overlap(candidate: Candidate, required: set[str]) -> int:
        return len({Ranker.normalize(skill) for skill in candidate.skills} & required)


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
