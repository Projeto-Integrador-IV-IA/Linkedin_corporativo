package br.com.linkedincorporativo.match.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import br.com.linkedincorporativo.match.client.ColaboradorDto;
import br.com.linkedincorporativo.match.client.MlCandidate;
import br.com.linkedincorporativo.match.client.MlMatchRequest;
import br.com.linkedincorporativo.match.client.MlMatchResponse;
import br.com.linkedincorporativo.match.client.MlMatchResultItem;
import br.com.linkedincorporativo.match.client.ProjectDto;
import br.com.linkedincorporativo.match.domain.MatchResult;
import br.com.linkedincorporativo.match.dto.RecommendationDto;
import br.com.linkedincorporativo.match.dto.RecommendationResponse;
import br.com.linkedincorporativo.match.repository.MatchResultRepository;

@Service
public class RecommendationService {

    private final RestClient restClient = RestClient.builder()
            .requestFactory(new SimpleClientHttpRequestFactory())
            .build();
    private final MatchResultRepository matchResultRepository;

    private final String profileServiceUrl;
    private final String projectServiceUrl;
    private final String mlEngineUrl;

    public RecommendationService(
            MatchResultRepository matchResultRepository,
            @Value("${services.profile-url}") String profileServiceUrl,
            @Value("${services.project-url}") String projectServiceUrl,
            @Value("${services.ml-engine-url}") String mlEngineUrl) {
        this.matchResultRepository = matchResultRepository;
        this.profileServiceUrl = profileServiceUrl;
        this.projectServiceUrl = projectServiceUrl;
        this.mlEngineUrl = mlEngineUrl;
    }

    @Transactional
    public RecommendationResponse recommend(Long projectId) {
        ProjectDto project = restClient.get()
                .uri(projectServiceUrl + "/api/projects/{id}", projectId)
                .retrieve()
                .body(ProjectDto.class);

        List<ColaboradorDto> colaboradores = restClient.get()
                .uri(profileServiceUrl + "/api/profiles")
                .retrieve()
                .body(new org.springframework.core.ParameterizedTypeReference<List<ColaboradorDto>>() {
                });

        List<MlCandidate> candidates = colaboradores.stream()
                .map(colaborador -> new MlCandidate(String.valueOf(colaborador.id()), colaborador.skills()))
                .toList();

        MlMatchRequest mlRequest = new MlMatchRequest(candidates, project.requiredSkills());

        MlMatchResponse mlResponse = restClient.post()
                .uri(mlEngineUrl + "/predict")
                .contentType(MediaType.APPLICATION_JSON)
                .body(mlRequest)
                .retrieve()
                .body(MlMatchResponse.class);

        Map<Long, ColaboradorDto> colaboradorById = colaboradores.stream()
                .collect(java.util.stream.Collectors.toMap(ColaboradorDto::id, c -> c));

        matchResultRepository.deleteByProjectId(projectId);

        List<RecommendationDto> results = mlResponse.results().stream()
                .map(item -> persistAndMap(projectId, colaboradorById, item))
                .toList();

        return new RecommendationResponse(project.id(), project.title(), results);
    }

    public RecommendationResponse lastRecommendation(Long projectId) {
        List<MatchResult> matches = matchResultRepository.findByProjectIdOrderByScoreDesc(projectId);
        List<RecommendationDto> results = matches.stream().map(RecommendationDto::from).toList();
        return new RecommendationResponse(projectId, null, results);
    }

    private RecommendationDto persistAndMap(Long projectId, Map<Long, ColaboradorDto> colaboradorById,
            MlMatchResultItem item) {
        Long colaboradorId = Long.valueOf(item.candidateId());
        ColaboradorDto colaborador = colaboradorById.get(colaboradorId);
        String name = colaborador != null ? colaborador.name() : "Colaborador " + colaboradorId;

        BigDecimal score = item.score();
        String matchedSkills = String.join(",", item.matchedSkills());
        String skillGaps = String.join(",", item.skillGaps());

        MatchResult match = new MatchResult(projectId, colaboradorId, name, score, matchedSkills, skillGaps);
        matchResultRepository.save(match);

        return RecommendationDto.from(match);
    }
}
