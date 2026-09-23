package br.com.linkedincorporativo.profile.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.linkedincorporativo.profile.dto.ColaboradorDto;
import br.com.linkedincorporativo.profile.dto.UpdateProfileRequest;
import br.com.linkedincorporativo.profile.service.ColaboradorService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/profiles")
public class ColaboradorController {

    private final ColaboradorService colaboradorService;

    public ColaboradorController(ColaboradorService colaboradorService) {
        this.colaboradorService = colaboradorService;
    }

    @GetMapping
    public List<ColaboradorDto> listAll() {
        return colaboradorService.listAll();
    }

    @GetMapping("/{id}")
    public ColaboradorDto findById(@PathVariable Long id) {
        return colaboradorService.findById(id);
    }

    @PutMapping("/{id}")
    public ColaboradorDto update(@PathVariable Long id, @Valid @RequestBody UpdateProfileRequest request) {
        return colaboradorService.update(id, request);
    }
}
