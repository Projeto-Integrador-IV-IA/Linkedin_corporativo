package br.com.linkedincorporativo.match.client;

import java.math.BigDecimal;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public record MlMatchResultItem(
        @JsonProperty("candidate_id") String candidateId,
        BigDecimal score,
        @JsonProperty("matched_skills") List<String> matchedSkills,
        @JsonProperty("skill_gaps") List<String> skillGaps) {
}
