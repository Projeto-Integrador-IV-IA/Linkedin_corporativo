package br.com.linkedincorporativo.project;

import br.com.linkedincorporativo.project.domain.Application;
import br.com.linkedincorporativo.project.domain.Project;
import br.com.linkedincorporativo.project.domain.UserAccount;
import br.com.linkedincorporativo.project.repository.ProjectRepository;
import jakarta.transaction.Transactional;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@RestController
@RequestMapping("/api/feed/projects")
public class ProjectFeedController {
    private final ProjectRepository projects;
    private final RestClient profileClient = RestClient.create();
    private final String profileUrl;

    public ProjectFeedController(ProjectRepository projects,
                                 @Value("${services.profile-url:http://profile-service:8081}") String profileUrl) {
        this.projects = projects;
        this.profileUrl = profileUrl;
    }

    @GetMapping
    @Transactional
    public ResponseEntity<?> feed(@RequestAttribute("currentUser") UserAccount currentUser) {
        ResponseEntity<?> denied = feedViewer(currentUser);
        if (denied != null) return denied;
        Map<String, OwnerPresentation> owners = ownerPresentationsByEmail();
        List<Map<String, Object>> feed = projects.findByStatusIgnoreCaseOrderByIdDesc("ABERTO").stream()
            .map(project -> view(project, currentUser, owners))
            .toList();
        return ResponseEntity.ok(feed);
    }

    @PostMapping("/{projectId}/interest")
    @Transactional
    public ResponseEntity<?> expressInterest(@PathVariable Long projectId,
                                             @RequestAttribute("currentUser") UserAccount currentUser) {
        ResponseEntity<?> denied = eligibleForInterest(currentUser, true);
        if (denied != null) return denied;
        return projects.findById(projectId).<ResponseEntity<?>>map(project -> {
            if (!"ABERTO".equalsIgnoreCase(project.getStatus())) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Este projeto não está aberto para novos interesses."));
            }
            if (isOwner(project, currentUser)) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Você não pode demonstrar interesse no seu próprio projeto."));
            }
            boolean exists = project.getApplications().stream().anyMatch(application -> isInterest(application) && belongsTo(application, currentUser));
            if (!exists) {
                Application interest = new Application(project, currentUser.getProfileId(), currentUser.getDisplayName(), currentUser.getEmail());
                interest.setUserId(currentUser.getId());
                interest.setStatus("INTERESSADO");
                project.getApplications().add(interest);
                projects.save(project);
            }
            return ResponseEntity.ok(viewWithOwner(project, currentUser));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{projectId}/interest")
    @Transactional
    public ResponseEntity<?> withdrawInterest(@PathVariable Long projectId,
                                              @RequestAttribute("currentUser") UserAccount currentUser) {
        ResponseEntity<?> denied = eligibleForInterest(currentUser, true);
        if (denied != null) return denied;
        return projects.findById(projectId).<ResponseEntity<?>>map(project -> {
            project.getApplications().removeIf(application -> isInterest(application) && belongsTo(application, currentUser));
            projects.save(project);
            return ResponseEntity.ok(viewWithOwner(project, currentUser));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    private static ResponseEntity<?> eligibleForInterest(UserAccount user, boolean requireProfile) {
        if (!canViewFeed(user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Sua conta não pode demonstrar interesse em projetos."));
        }
        if (requireProfile && user.getProfileId() == null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Complete e salve seu perfil antes de demonstrar interesse."));
        }
        return null;
    }

    private static ResponseEntity<?> feedViewer(UserAccount user) {
        if (canViewFeed(user)) return null;
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Sua conta não pode acessar o feed de oportunidades."));
    }

    private static boolean canViewFeed(UserAccount user) {
        return "CANDIDATE".equalsIgnoreCase(user.getRole())
            || "RECRUITER".equalsIgnoreCase(user.getRole())
            || "MANAGER".equalsIgnoreCase(user.getRole());
    }

    private static boolean isOwner(Project project, UserAccount user) {
        if (project.getOwnerUserId() != null) return Objects.equals(project.getOwnerUserId(), user.getId());
        return project.getOwnerEmail() != null && project.getOwnerEmail().equalsIgnoreCase(user.getEmail());
    }

    private static boolean belongsTo(Application application, UserAccount user) {
        if (application.getUserId() != null) return Objects.equals(application.getUserId(), user.getId());
        return user.getProfileId() != null && Objects.equals(application.getProfileId(), user.getProfileId());
    }

    private static boolean isInterest(Application application) {
        return "INTERESSADO".equalsIgnoreCase(application.getStatus());
    }

    private Map<String, Object> viewWithOwner(Project project, UserAccount user) {
        return view(project, user, ownerPresentationsByEmail());
    }

    private Map<String, OwnerPresentation> ownerPresentationsByEmail() {
        try {
            List<Map<String, Object>> profiles = profileClient.get().uri(profileUrl + "/api/profiles")
                .retrieve().body(new ParameterizedTypeReference<>() {});
            Map<String, OwnerPresentation> owners = new LinkedHashMap<>();
            if (profiles == null) return owners;
            for (Map<String, Object> profile : profiles) {
                String email = value(profile.get("email")).trim().toLowerCase();
                if (email.isBlank()) continue;
                owners.put(email, new OwnerPresentation(value(profile.get("fullName")), value(profile.get("avatarUrl"))));
            }
            return owners;
        } catch (RestClientException exception) {
            return Map.of();
        }
    }

    private static Map<String, Object> view(Project project, UserAccount user, Map<String, OwnerPresentation> owners) {
        OwnerPresentation owner = owners.get(value(project.getOwnerEmail()).trim().toLowerCase());
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", project.getId());
        response.put("title", value(project.getTitle()));
        response.put("description", value(project.getDescription()));
        response.put("area", value(project.getArea()));
        response.put("ownerName", owner != null && !owner.name().isBlank() ? owner.name() : value(project.getOwnerName()));
        response.put("ownerAvatarUrl", owner == null ? "" : owner.avatarUrl());
        response.put("status", value(project.getStatus()));
        response.put("interestedCount", project.getApplications().stream().filter(ProjectFeedController::isInterest).count());
        response.put("interested", project.getApplications().stream().anyMatch(application -> isInterest(application) && belongsTo(application, user)));
        return response;
    }

    private static String value(String value) { return value == null ? "" : value; }
    private static String value(Object value) { return value == null ? "" : String.valueOf(value); }
    private record OwnerPresentation(String name, String avatarUrl) {}
}
