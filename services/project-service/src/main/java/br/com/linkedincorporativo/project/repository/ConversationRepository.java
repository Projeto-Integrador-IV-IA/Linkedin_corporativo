package br.com.linkedincorporativo.project.repository;

import br.com.linkedincorporativo.project.domain.Conversation;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    List<Conversation> findByRecruiterUserIdOrderByUpdatedAtDesc(Long userId);
    List<Conversation> findByProfessionalProfileIdOrderByUpdatedAtDesc(Long profileId);
    List<Conversation> findByProfessionalEmailIgnoreCaseOrderByUpdatedAtDesc(String email);
    Optional<Conversation> findByProjectIdAndRecruiterUserIdAndProfessionalProfileId(Long projectId, Long recruiterUserId, Long profileId);
}
