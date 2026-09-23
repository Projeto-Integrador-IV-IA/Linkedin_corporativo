package br.com.linkedincorporativo.profile.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.linkedincorporativo.profile.domain.Colaborador;

public interface ColaboradorRepository extends JpaRepository<Colaborador, Long> {

    Optional<Colaborador> findByEmail(String email);

    boolean existsByEmail(String email);
}
