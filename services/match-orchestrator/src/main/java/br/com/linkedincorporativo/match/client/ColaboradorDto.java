package br.com.linkedincorporativo.match.client;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ColaboradorDto(Long id, String name, String email, String title, List<String> skills) {
}
