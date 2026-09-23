package br.com.linkedincorporativo.project.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

public record CreateProjectRequest(
        @NotBlank String title,
        String description,
        @NotEmpty List<String> requiredSkills) {
}
