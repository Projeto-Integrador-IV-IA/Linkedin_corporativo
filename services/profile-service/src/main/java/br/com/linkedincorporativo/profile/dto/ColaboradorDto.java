package br.com.linkedincorporativo.profile.dto;

import java.util.List;

import br.com.linkedincorporativo.profile.domain.Colaborador;

public record ColaboradorDto(
        Long id,
        String name,
        String email,
        String title,
        String phone,
        String objective,
        List<String> skills) {

    public static ColaboradorDto from(Colaborador colaborador) {
        return new ColaboradorDto(
                colaborador.getId(),
                colaborador.getName(),
                colaborador.getEmail(),
                colaborador.getTitle(),
                colaborador.getPhone(),
                colaborador.getObjective(),
                colaborador.getSkills().stream().map(skill -> skill.getSkill()).toList());
    }
}
