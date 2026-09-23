package br.com.linkedincorporativo.project;

import br.com.linkedincorporativo.project.domain.CandidateDecision;
import br.com.linkedincorporativo.project.domain.Project;
import br.com.linkedincorporativo.project.domain.UserAccount;
import br.com.linkedincorporativo.project.repository.CandidateDecisionRepository;
import br.com.linkedincorporativo.project.repository.ProjectRepository;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/projects")
public class CandidateDecisionController {
    private final ProjectRepository projects;
    private final CandidateDecisionRepository decisions;

    public CandidateDecisionController(ProjectRepository projects, CandidateDecisionRepository decisions) {
        this.projects = projects;
        this.decisions = decisions;
    }

    @GetMapping("/{projectId}/candidate-decisions")
    public ResponseEntity<?> list(@PathVariable Long projectId, @RequestAttribute("currentUser") UserAccount user) {
        Project project = ownedProject(projectId, user);
        if (project == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Acesso negado."));
        return ResponseEntity.ok(decisions.findByProjectIdAndRecruiterUserId(projectId, user.getId()).stream().map(this::view).toList());
    }

    @PostMapping("/{projectId}/candidate-decisions/{profileId}")
    public ResponseEntity<?> decide(
        @PathVariable Long projectId,
        @PathVariable Long profileId,
        @RequestBody DecisionRequest request,
        @RequestAttribute("currentUser") UserAccount user
    ) {
        Project project = ownedProject(projectId, user);
        if (project == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Acesso negado."));
        String status = request.status() == null ? "PENDENTE" : request.status().trim().toUpperCase();
        if (!List.of("PENDENTE", "ACEITO", "REJEITADO").contains(status)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Status de decisão inválido."));
        }
        CandidateDecision decision = decisions.findByProjectIdAndProfileIdAndRecruiterUserId(projectId, profileId, user.getId())
            .orElseGet(() -> new CandidateDecision(project, profileId, user.getId(), status));
        decision.setStatus(status);
        return ResponseEntity.ok(view(decisions.save(decision)));
    }

    private Project ownedProject(Long id, UserAccount user) {
        return projects.findById(id).filter(project -> user.getId().equals(project.getOwnerUserId())).orElse(null);
    }

    private Map<String, Object> view(CandidateDecision decision) {
        return Map.of("id", decision.getId(), "projectId", decision.getProject().getId(), "profileId", decision.getProfileId(),
            "status", decision.getStatus(), "createdAt", decision.getCreatedAt().toString(), "updatedAt", decision.getUpdatedAt().toString());
    }

    public record DecisionRequest(String status) {}
}
