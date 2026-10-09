package br.com.linkedincorporativo.project.repository;

import br.com.linkedincorporativo.project.domain.RecruiterNote;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecruiterNoteRepository extends JpaRepository<RecruiterNote, Long> {
    Optional<RecruiterNote> findByConversationIdAndRecruiterUserId(Long conversationId, Long recruiterUserId);
}
