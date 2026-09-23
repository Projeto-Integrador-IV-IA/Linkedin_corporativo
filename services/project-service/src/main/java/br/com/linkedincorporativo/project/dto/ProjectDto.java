package br.com.linkedincorporativo.project.dto;

import java.time.OffsetDateTime;
import java.util.List;

import br.com.linkedincorporativo.project.domain.Project;

public record ProjectDto(
        Long id,
        String title,
        String description,
        String status,
        List<String> requiredSkills,
        OffsetDateTime createdAt) {

    public static ProjectDto from(Project project) {
        return new ProjectDto(
                project.getId(),
                project.getTitle(),
                project.getDescription(),
                project.getStatus(),
                project.getRequiredSkills().stream().map(skill -> skill.getSkill()).toList(),
                project.getCreatedAt());
    }
}
