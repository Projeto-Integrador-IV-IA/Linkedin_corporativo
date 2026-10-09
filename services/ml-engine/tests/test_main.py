from app.main import Candidate, MatchRequest, Ranker


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

    assert {result["candidate_id"] for result in ranker.predict(payload)} == {"1", "2"}
