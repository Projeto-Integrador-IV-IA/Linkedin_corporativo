package br.com.linkedincorporativo.project.repository;

import br.com.linkedincorporativo.project.domain.CandidateDecision;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CandidateDecisionRepository extends JpaRepository<CandidateDecision, Long> {
    List<CandidateDecision> findByProjectId(Long projectId);
    List<CandidateDecision> findByProjectIdAndRecruiterUserId(Long projectId, Long recruiterUserId);
    Optional<CandidateDecision> findByProjectIdAndProfileIdAndRecruiterUserId(Long projectId, Long profileId, Long recruiterUserId);
}
