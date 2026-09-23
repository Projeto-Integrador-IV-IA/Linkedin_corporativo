package br.com.linkedincorporativo.match.dto;

import java.math.BigDecimal;
import java.util.List;

import br.com.linkedincorporativo.match.domain.MatchResult;

public record RecommendationDto(
        Long colaboradorId,
        String name,
        BigDecimal score,
        List<String> matchedSkills,
        List<String> skillGaps) {

    private static List<String> split(String csv) {
        return csv == null || csv.isBlank() ? List.of() : List.of(csv.split(","));
    }

    public static RecommendationDto from(MatchResult match) {
        return new RecommendationDto(
                match.getColaboradorId(),
                match.getColaboradorName(),
                match.getScore(),
                split(match.getMatchedSkills()),
                split(match.getSkillGaps()));
    }
}
