package br.com.linkedincorporativo.profile.service;

import java.util.List;
import java.util.NoSuchElementException;

import org.springframework.stereotype.Service;

import br.com.linkedincorporativo.profile.domain.Colaborador;
import br.com.linkedincorporativo.profile.domain.ColaboradorSkill;
import br.com.linkedincorporativo.profile.dto.ColaboradorDto;
import br.com.linkedincorporativo.profile.dto.UpdateProfileRequest;
import br.com.linkedincorporativo.profile.repository.ColaboradorRepository;

@Service
public class ColaboradorService {

    private final ColaboradorRepository colaboradorRepository;

    public ColaboradorService(ColaboradorRepository colaboradorRepository) {
        this.colaboradorRepository = colaboradorRepository;
    }

    public List<ColaboradorDto> listAll() {
        return colaboradorRepository.findAll().stream().map(ColaboradorDto::from).toList();
    }

    public ColaboradorDto findById(Long id) {
        return colaboradorRepository.findById(id)
                .map(ColaboradorDto::from)
                .orElseThrow(() -> new NoSuchElementException("colaborador not found: " + id));
    }

    public ColaboradorDto update(Long id, UpdateProfileRequest request) {
        Colaborador colaborador = colaboradorRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("colaborador not found: " + id));

        colaborador.setName(request.name());
        colaborador.setTitle(request.title());
        colaborador.setPhone(request.phone());
        colaborador.setObjective(request.objective());
        colaborador.getSkills().clear();
        request.skills().forEach(skill -> colaborador.getSkills().add(new ColaboradorSkill(skill)));

        return ColaboradorDto.from(colaboradorRepository.save(colaborador));
    }
}
