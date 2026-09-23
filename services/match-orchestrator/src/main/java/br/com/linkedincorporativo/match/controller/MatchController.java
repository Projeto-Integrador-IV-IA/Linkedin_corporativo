package br.com.linkedincorporativo.match.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.linkedincorporativo.match.dto.RecommendationResponse;
import br.com.linkedincorporativo.match.service.RecommendationService;

@RestController
@RequestMapping("/api/matches")
public class MatchController {

    private final RecommendationService recommendationService;

    public MatchController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @PostMapping("/recommend/{projectId}")
    public RecommendationResponse recommend(@PathVariable Long projectId) {
        return recommendationService.recommend(projectId);
    }

    @GetMapping("/project/{projectId}")
    public RecommendationResponse lastRecommendation(@PathVariable Long projectId) {
        return recommendationService.lastRecommendation(projectId);
    }
}
