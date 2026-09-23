package br.com.linkedincorporativo.match.client;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ProjectDto(Long id, String title, String description, String status, List<String> requiredSkills) {
}
