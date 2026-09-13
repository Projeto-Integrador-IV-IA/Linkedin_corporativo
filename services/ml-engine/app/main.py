from fastapi import FastAPI
from pydantic import BaseModel


app = FastAPI(title="ML Engine", version="0.0.1")


class Candidate(BaseModel):
    candidate_id: str
    skills: list[str]


class MatchRequest(BaseModel):
    candidates: list[Candidate]
    required_skills: list[str]


@app.get("/")
def home() -> dict[str, str]:
    return {"service": "ml-engine", "status": "UP"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "UP"}


@app.post("/predict")
def predict(payload: MatchRequest) -> dict[str, list[dict[str, object]]]:
    required = {skill.lower() for skill in payload.required_skills}

    results = []
    for candidate in payload.candidates:
        candidate_skills = {skill.lower() for skill in candidate.skills}
        matched = sorted(candidate_skills.intersection(required))
        gaps = sorted(required.difference(candidate_skills))
        score = len(matched) / len(required) * 100 if required else 0.0
        results.append(
            {
                "candidate_id": candidate.candidate_id,
                "score": round(score, 2),
                "matched_skills": matched,
                "skill_gaps": gaps,
            }
        )

    results.sort(key=lambda result: result["score"], reverse=True)
    return {"results": results}
