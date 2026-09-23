package br.com.linkedincorporativo.project;

import br.com.linkedincorporativo.project.domain.CandidateDecision;
import br.com.linkedincorporativo.project.domain.Project;
import br.com.linkedincorporativo.project.domain.UserAccount;
import br.com.linkedincorporativo.project.repository.CandidateDecisionRepository;
import br.com.linkedincorporativo.project.repository.ProjectRepository;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@RestController
@RequestMapping("/api/projects")
public class CandidateDecisionController {
    private final ProjectRepository projects;
    private final CandidateDecisionRepository decisions;
    private final RestClient profileClient = RestClient.create();
    private final String profileUrl;

    public CandidateDecisionController(ProjectRepository projects, CandidateDecisionRepository decisions,
                                       @Value("${services.profile-url:http://profile-service:8081}") String profileUrl) {
        this.projects = projects;
        this.decisions = decisions;
        this.profileUrl = profileUrl;
    }

    @GetMapping("/{projectId}/candidate-decisions")
    public ResponseEntity<?> list(@PathVariable Long projectId, @RequestAttribute("currentUser") UserAccount user) {
        Project project = ownedProject(projectId, user);
        if (project == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Acesso negado."));
        return ResponseEntity.ok(decisions.findByProjectIdAndRecruiterUserId(projectId, user.getId()).stream().map(this::view).toList());
    }

    @PostMapping("/{projectId}/candidate-decisions/{profileId}")
    @Transactional
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
        String previousStatus = decision.getStatus();
        decision.setStatus(status);
        CandidateDecision saved = decisions.save(decision);
        syncPortfolio(project, profileId, status, previousStatus);
        return ResponseEntity.ok(view(saved));
    }

    private Project ownedProject(Long id, UserAccount user) {
        return projects.findById(id).filter(project -> user.getId().equals(project.getOwnerUserId())).orElse(null);
    }

    private Map<String, Object> view(CandidateDecision decision) {
        return Map.of("id", decision.getId(), "projectId", decision.getProject().getId(), "profileId", decision.getProfileId(),
            "status", decision.getStatus(), "createdAt", decision.getCreatedAt().toString(), "updatedAt", decision.getUpdatedAt().toString());
    }

    private void syncPortfolio(Project project, Long profileId, String status, String previousStatus) {
        try {
            String endpoint = profileUrl + "/api/profiles/" + profileId + "/portfolio";
            if ("ACEITO".equals(status)) {
                String technologies = project.getRequiredSkills().stream()
                    .map(skill -> skill.getSkillName() + " (" + skill.getRequiredLevel() + ")")
                    .collect(Collectors.joining(", "));
                profileClient.post().uri(endpoint)
                    .body(Map.of("sourceProjectId", project.getId(), "title", project.getTitle(),
                        "description", project.getDescription() == null ? "" : project.getDescription(), "technologies", technologies))
                    .retrieve().toBodilessEntity();
            } else if ("ACEITO".equals(previousStatus)) {
                profileClient.delete().uri(endpoint + "/source-project/" + project.getId())
                    .retrieve().toBodilessEntity();
            }
        } catch (RestClientException exception) {
            throw new IllegalStateException("Não foi possível sincronizar o projeto no perfil do profissional.", exception);
        }
    }

    public record DecisionRequest(String status) {}
}
