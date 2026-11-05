import pytest

from app.main import Candidate, MatchRequest, Ranker, ranker as published_ranker


def test_description_fallback_ranks_the_closest_profile_first() -> None:
    ranker = Ranker()
    ranker.loaded = False
    payload = MatchRequest(
        project_description="Construção de APIs Python com FastAPI e PostgreSQL",
        candidates=[
            Candidate(candidate_id="unrelated", profile_description="Design editorial e produção de conteúdo"),
            Candidate(candidate_id="matching", profile_description="Desenvolvi APIs em Python, FastAPI e PostgreSQL"),
        ],
    )

    results = ranker.predict(payload)

    assert [result["candidate_id"] for result in results] == ["matching", "unrelated"]
    assert results[0]["score"] > results[1]["score"]


def test_every_candidate_is_returned_even_without_a_description() -> None:
    ranker = Ranker()
    ranker.loaded = False
    payload = MatchRequest(
        project_description="Análise de dados",
        candidates=[Candidate(candidate_id="1", profile_description=""), Candidate(candidate_id="2", profile_description="dados")],
    )

    results = ranker.predict(payload)

    assert {result["candidate_id"] for result in results} == {"1", "2"}
    assert next(result["score"] for result in results if result["candidate_id"] == "1") == 0.0


def test_fallback_does_not_saturate_partially_related_profiles() -> None:
    ranker = Ranker()
    ranker.loaded = False
    payload = MatchRequest(
        project_description="Desenvolvimento de automações em Python e integração de APIs",
        candidates=[
            Candidate(candidate_id="exact", profile_description="Desenvolvimento de automações em Python e integração de APIs"),
            Candidate(candidate_id="partial", profile_description="Experiência com APIs e desenvolvimento Python"),
            Candidate(candidate_id="unrelated", profile_description="Design gráfico, identidade visual e ilustração"),
        ],
    )

    results = ranker.predict(payload)
    scores = {str(result["candidate_id"]): float(result["score"]) for result in results}

    assert scores["exact"] == 100.0
    assert scores["exact"] > scores["partial"] > scores["unrelated"]
    assert scores["partial"] < 80.0


@pytest.mark.skipif(not published_ranker.loaded, reason="Artefato publicado não está disponível neste ambiente.")
def test_published_model_returns_distinct_non_saturated_scores() -> None:
    payload = MatchRequest(
        project_description="Desenvolvimento de automações em Python e integração de APIs",
        candidates=[
            Candidate(candidate_id="partial", profile_description="Experiência com APIs e desenvolvimento Python"),
            Candidate(candidate_id="unrelated", profile_description="Design gráfico, identidade visual e ilustração"),
            Candidate(candidate_id="empty", profile_description=""),
        ],
    )

    results = published_ranker.predict(payload)
    scores = {str(result["candidate_id"]): float(result["score"]) for result in results}

    assert len(set(scores.values())) == len(scores)
    assert max(scores.values()) < 99.5
    assert scores["empty"] == 0.0
