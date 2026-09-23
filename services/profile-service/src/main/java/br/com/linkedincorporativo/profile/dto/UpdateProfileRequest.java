package br.com.linkedincorporativo.profile.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

public record UpdateProfileRequest(
        @NotBlank String name,
        String title,
        String phone,
        String objective,
        @NotEmpty List<String> skills) {
}
