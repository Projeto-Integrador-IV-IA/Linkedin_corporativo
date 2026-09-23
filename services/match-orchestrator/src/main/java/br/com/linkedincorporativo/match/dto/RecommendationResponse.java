package br.com.linkedincorporativo.match.dto;

import java.util.List;

public record RecommendationResponse(Long projectId, String projectTitle, List<RecommendationDto> results) {
}
