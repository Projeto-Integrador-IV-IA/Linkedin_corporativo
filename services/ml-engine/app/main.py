from fastapi import FastAPI
from pydantic import BaseModel


app = FastAPI(title="ML Engine", version="0.0.1")


class MatchRequest(BaseModel):
    candidate_skills: list[str] = []
    required_skills: list[str] = []


@app.get("/")
def home() -> dict[str, str]:
    return {"service": "ml-engine", "status": "UP"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "UP"}


@app.post("/predict")
def predict(payload: MatchRequest) -> dict[str, float]:
    candidate = {skill.lower() for skill in payload.candidate_skills}
    required = {skill.lower() for skill in payload.required_skills}

    if not required:
        return {"score": 0.0}

    score = len(candidate.intersection(required)) / len(required)
    return {"score": round(score, 4)}
