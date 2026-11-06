import os
import re
import unicodedata
from pathlib import Path

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from sklearn.feature_extraction.text import HashingVectorizer
from starlette.responses import JSONResponse

from app.semantic import SemanticEncoder


app = FastAPI(title="ML Engine", version="4.0.0")
TOKEN_RE = re.compile(r"[a-z0-9+#.]+", re.IGNORECASE)
EXPECTED_FEATURES = ["text_similarity", "token_jaccard", "profile_word_count", "project_word_count"]
RANKING_VERSION = "hybrid-semantic-ranker-v4"
SEMANTIC_MODEL_ID = "intfloat/multilingual-e5-small"
SEMANTIC_MODEL_REVISION = "614241f622f53c4eeff9890bdc4f31cfecc418b3"
SEMANTIC_WEIGHT = 0.70
SEMANTIC_FLOOR = 0.82
SEMANTIC_SPAN = 0.12
NEGATION_FACTOR = 0.25
NEGATION_PATTERNS = (
    re.compile(r"\bn[aãa]o\s+(?:tenho|possuo|domino|conheço|trabalhei|atuei|usei)\b", re.IGNORECASE),
    re.compile(r"\bsem\s+(?:experiência|conhecimento|prática|vivência)\b", re.IGNORECASE),
    re.compile(r"\bnunca\s+(?:trabalhei|atuei|usei)\b", re.IGNORECASE),
    re.compile(r"\b(?:apenas|só)\s+copi(?:ei|ado|ada)\b", re.IGNORECASE),
)


class Candidate(BaseModel):
    candidate_id: str
    profile_description: str = Field(default="", max_length=30000)


class MatchRequest(BaseModel):
    candidates: list[Candidate] = Field(max_length=5_000)
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
        self.semantic = None
        self.semantic_error = None
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

        semantic_model_path = Path(os.getenv("SEMANTIC_MODEL_PATH", "/app/models/semantic-e5/model.onnx"))
        semantic_tokenizer_path = Path(os.getenv("SEMANTIC_TOKENIZER_PATH", "/app/models/semantic-e5/tokenizer.json"))
        try:
            if not semantic_model_path.exists() or not semantic_tokenizer_path.exists():
                raise FileNotFoundError("modelo ou tokenizer semântico ausente")
            self.semantic = SemanticEncoder(
                semantic_model_path,
                semantic_tokenizer_path,
                cache_size=int(os.getenv("SEMANTIC_CACHE_SIZE", "10000")),
                batch_size=int(os.getenv("SEMANTIC_BATCH_SIZE", "64")),
                threads=int(os.getenv("SEMANTIC_THREADS", "4")),
            )
            self.score_semantics = "hybrid semantic-textual affinity index; not hiring probability"
        except Exception as error:  # pragma: no cover - validado pelo healthcheck da imagem
            self.semantic_error = str(error)
            print(f"Não foi possível carregar o encoder semântico: {error}", flush=True)

    @property
    def ready(self) -> bool:
        return self.loaded and self.semantic is not None

    def predict(self, payload: MatchRequest) -> list[dict[str, object]]:
        profiles = [candidate.profile_description.strip() for candidate in payload.candidates]
        project = payload.project_description.strip()

        if not payload.candidates:
            return []
        if self.loaded:
            matrix = self.features(profiles, project, self.vectorizer)
            lexical_scores = self.model.predict_proba(matrix)[:, 1]
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
            lexical_scores = self.features(profiles, project, vectorizer)[:, 0]

        if self.semantic is not None:
            semantic_cosines = self.semantic.similarities(project, profiles)
            semantic_scores = np.clip((semantic_cosines - SEMANTIC_FLOOR) / SEMANTIC_SPAN, 0.0, 1.0)
            scores = ((1.0 - SEMANTIC_WEIGHT) * lexical_scores) + (SEMANTIC_WEIGHT * semantic_scores)
            penalties = np.asarray(
                [NEGATION_FACTOR if self.has_relevant_negation(profile, project) else 1.0 for profile in profiles],
                dtype=np.float32,
            )
            scores *= penalties
        else:
            scores = lexical_scores

        # Sem texto não existe evidência de aderência. A taxa-base aprendida
        # pelo classificador não deve aparecer ao usuário como compatibilidade.
        scores = np.where(np.asarray([bool(profile) for profile in profiles]), scores * 100.0, 0.0)

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

    def has_relevant_negation(self, profile: str, project: str) -> bool:
        project_tokens = self.normalized_tokens(project)
        for sentence in re.split(r"[.;!?\n]+", profile):
            if not any(pattern.search(sentence) for pattern in NEGATION_PATTERNS):
                continue
            sentence_tokens = self.normalized_tokens(sentence)
            token_overlap = len(project_tokens & sentence_tokens)
            lexical_similarity = float(self.features([sentence], project, self.vectorizer)[0, 0])
            if token_overlap >= 2 or lexical_similarity >= 0.15:
                return True
        return False

    @staticmethod
    def normalized_tokens(value: str) -> set[str]:
        normalized = unicodedata.normalize("NFKD", value.casefold()).encode("ascii", "ignore").decode("ascii")
        return set(re.findall(r"[a-z0-9+#.]+", normalized))



ranker = Ranker()


def health_payload() -> dict[str, object]:
    return {
        "status": "UP" if ranker.ready else "DEGRADED",
        "ready": ranker.ready,
        "ranking_version": RANKING_VERSION,
        "model_loaded": ranker.loaded,
        "artifact_version": ranker.artifact_version,
        "trained_at": ranker.trained_at,
        "semantic_model_loaded": ranker.semantic is not None,
        "semantic_model_id": SEMANTIC_MODEL_ID,
        "semantic_model_revision": SEMANTIC_MODEL_REVISION,
        "semantic_error": ranker.semantic_error,
        "score_semantics": ranker.score_semantics,
        "semantic_cache": ranker.semantic.cache_info() if ranker.semantic is not None else None,
    }


@app.get("/")
def home() -> dict[str, object]:
    return {"service": "ml-engine", **health_payload()}


@app.get("/health")
def health() -> JSONResponse:
    payload = health_payload()
    return JSONResponse(payload, status_code=200 if ranker.ready else 503)


@app.post("/predict")
def predict(payload: MatchRequest) -> dict[str, object]:
    require_semantic = os.getenv("REQUIRE_SEMANTIC_MODEL", "true").casefold() == "true"
    if require_semantic and not ranker.ready:
        raise HTTPException(status_code=503, detail="Ranker híbrido v4 não está pronto.")
    return {"ranking_version": RANKING_VERSION, "results": ranker.predict(payload)}
