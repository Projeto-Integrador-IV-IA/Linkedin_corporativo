package br.com.linkedincorporativo.profile.repository;

import br.com.linkedincorporativo.profile.domain.Skill;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SkillRepository extends JpaRepository<Skill, Long> {
    Optional<Skill> findByNameIgnoreCase(String name);
}
