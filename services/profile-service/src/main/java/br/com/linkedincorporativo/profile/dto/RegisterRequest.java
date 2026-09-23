package br.com.linkedincorporativo.profile.dto;

import java.util.List;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank String name,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 6, message = "password must have at least 6 characters") String password,
        String title,
        String phone,
        String objective,
        @NotEmpty List<String> skills) {
}
