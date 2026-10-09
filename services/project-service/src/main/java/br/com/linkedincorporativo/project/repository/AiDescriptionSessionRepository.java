package br.com.linkedincorporativo.project.repository;

import br.com.linkedincorporativo.project.domain.AiDescriptionSession;
import java.time.Instant;
import java.util.Collection;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiDescriptionSessionRepository extends JpaRepository<AiDescriptionSession, Long> {
    Optional<AiDescriptionSession> findFirstByUserIdAndContextTypeInAndCooldownUntilAfterOrderByCreatedAtDesc(
        Long userId, Collection<String> contextTypes, Instant now
    );
}
