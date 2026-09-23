package br.com.linkedincorporativo.profile.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import br.com.linkedincorporativo.profile.domain.Colaborador;
import br.com.linkedincorporativo.profile.domain.ColaboradorSkill;
import br.com.linkedincorporativo.profile.dto.AuthResponse;
import br.com.linkedincorporativo.profile.dto.ColaboradorDto;
import br.com.linkedincorporativo.profile.dto.LoginRequest;
import br.com.linkedincorporativo.profile.dto.RegisterRequest;
import br.com.linkedincorporativo.profile.repository.ColaboradorRepository;

@Service
public class AuthService {

    private final ColaboradorRepository colaboradorRepository;
    private final JwtService jwtService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(ColaboradorRepository colaboradorRepository, JwtService jwtService) {
        this.colaboradorRepository = colaboradorRepository;
        this.jwtService = jwtService;
    }

    public AuthResponse register(RegisterRequest request) {
        if (colaboradorRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("email already registered: " + request.email());
        }

        Colaborador colaborador = new Colaborador();
        colaborador.setName(request.name());
        colaborador.setEmail(request.email());
        colaborador.setTitle(request.title());
        colaborador.setPhone(request.phone());
        colaborador.setObjective(request.objective());
        colaborador.setPasswordHash(passwordEncoder.encode(request.password()));
        colaborador.setSkills(request.skills().stream().map(ColaboradorSkill::new).toList());

        Colaborador saved = colaboradorRepository.save(colaborador);
        return issueAuthResponse(saved);
    }

    public AuthResponse login(LoginRequest request) {
        Colaborador colaborador = colaboradorRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("invalid credentials"));

        if (!passwordEncoder.matches(request.password(), colaborador.getPasswordHash())) {
            throw new IllegalArgumentException("invalid credentials");
        }

        return issueAuthResponse(colaborador);
    }

    private AuthResponse issueAuthResponse(Colaborador colaborador) {
        String token = jwtService.generateToken(colaborador.getId(), colaborador.getEmail());
        return new AuthResponse(token, ColaboradorDto.from(colaborador));
    }
}
