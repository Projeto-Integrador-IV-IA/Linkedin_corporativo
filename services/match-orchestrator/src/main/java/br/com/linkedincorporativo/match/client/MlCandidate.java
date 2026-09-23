package br.com.linkedincorporativo.match.client;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public record MlCandidate(@JsonProperty("candidate_id") String candidateId, List<String> skills) {
}
