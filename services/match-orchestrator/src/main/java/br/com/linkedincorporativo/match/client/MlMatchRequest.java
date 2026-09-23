package br.com.linkedincorporativo.match.client;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public record MlMatchRequest(
        List<MlCandidate> candidates,
        @JsonProperty("required_skills") List<String> requiredSkills) {
}
