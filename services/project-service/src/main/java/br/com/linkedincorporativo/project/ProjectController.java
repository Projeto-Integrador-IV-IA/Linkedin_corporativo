package br.com.linkedincorporativo.project;

import br.com.linkedincorporativo.project.domain.Application;
import br.com.linkedincorporativo.project.domain.Project;
import br.com.linkedincorporativo.project.domain.RequiredSkill;
import br.com.linkedincorporativo.project.domain.UserAccount;
import br.com.linkedincorporativo.project.repository.CandidateDecisionRepository;
import br.com.linkedincorporativo.project.repository.ProjectRepository;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {
    private final ProjectRepository projects;
    private final CandidateDecisionRepository candidateDecisions;

    public ProjectController(ProjectRepository projects, CandidateDecisionRepository candidateDecisions) {
        this.projects = projects;
        this.candidateDecisions = candidateDecisions;
    }

    @GetMapping
    @Transactional
    public List<Map<String, Object>> list(@RequestAttribute(value = "currentUser", required = false) UserAccount currentUser) {
        var source = currentUser == null ? projects.findAll() : projects.findByOwnerUserIdOrOwnerEmail(currentUser.getId(), currentUser.getEmail());
        if (currentUser != null) source.forEach(project -> claimLegacyOwnership(project, currentUser));
        return source.stream().map(this::view).toList();
    }

    @GetMapping("/{id}")
    @Transactional
    public ResponseEntity<?> get(@PathVariable Long id, @RequestAttribute(value = "currentUser", required = false) UserAccount currentUser) {
        return projects.findById(id).<ResponseEntity<?>>map(project -> {
            if (!canManage(project, currentUser)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Você não tem acesso a este projeto."));
            claimLegacyOwnership(project, currentUser);
            return ResponseEntity.ok(view(project));
        })
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody ProjectRequest request, @RequestAttribute(value = "currentUser", required = false) UserAccount currentUser) {
        if (blank(request.title()) || blank(request.ownerName()) || blank(request.ownerEmail())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Título, responsável e e-mail são obrigatórios."));
        }
        Project project = new Project();
        copy(request, project);
        if (currentUser == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Usuário não autenticado."));
        project.setOwnerUserId(currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(view(projects.save(project)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody ProjectRequest request, @RequestAttribute(value = "currentUser", required = false) UserAccount currentUser) {
        return projects.findById(id).map(project -> {
            if (!canManage(project, currentUser)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Você só pode editar seus próprios projetos."));
            copy(request, project);
            return ResponseEntity.ok(view(projects.save(project)));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> status(@PathVariable Long id, @RequestBody StatusRequest request, @RequestAttribute(value = "currentUser", required = false) UserAccount currentUser) {
        return projects.findById(id).map(project -> {
            if (!canManage(project, currentUser)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Você só pode alterar seus próprios projetos."));
            project.setStatus(request.status());
            return ResponseEntity.ok(view(projects.save(project)));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable Long id, @RequestAttribute(value = "currentUser", required = false) UserAccount currentUser) {
        var project = projects.findById(id);
        if (project.isEmpty()) return ResponseEntity.notFound().build();
        if (currentUser != null && !canManage(project.get(), currentUser)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        candidateDecisions.deleteAll(candidateDecisions.findByProjectId(id));
        projects.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/required-skills")
    @Transactional
    public ResponseEntity<?> addRequiredSkill(@PathVariable Long id, @RequestBody RequiredSkillRequest request, @RequestAttribute(value = "currentUser", required = false) UserAccount currentUser) {
        return projects.findById(id).map(project -> {
            if (!canManage(project, currentUser)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Você só pode alterar seus próprios projetos."));
            if (!blank(request.skillName()) && project.getRequiredSkills().stream().noneMatch(skill -> skill.getSkillName() != null && skill.getSkillName().trim().equalsIgnoreCase(request.skillName().trim()))) {
                project.getRequiredSkills().add(new RequiredSkill(project, request.skillName().trim(), defaultValue(request.requiredLevel(), "BASICO")));
            }
            return ResponseEntity.ok(view(projects.save(project)));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}/required-skills/{skillId}")
    @Transactional
    public ResponseEntity<?> removeRequiredSkill(@PathVariable Long id, @PathVariable Long skillId, @RequestAttribute(value = "currentUser", required = false) UserAccount currentUser) {
        return projects.findById(id).map(project -> {
            if (!canManage(project, currentUser)) return ResponseEntity.<Void>status(HttpStatus.FORBIDDEN).build();
            project.getRequiredSkills().removeIf(skill -> Objects.equals(skill.getId(), skillId));
            projects.save(project);
            return ResponseEntity.noContent().<Void>build();
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/applications")
    @Transactional
    public ResponseEntity<?> apply(@PathVariable Long id, @RequestBody ApplicationRequest request, @RequestAttribute(value = "currentUser", required = false) UserAccount currentUser) {
        return projects.findById(id).map(project -> {
            if (!canManage(project, currentUser)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Você só pode gerenciar seus próprios projetos."));
            boolean exists = project.getApplications().stream().anyMatch(app -> Objects.equals(app.getProfileId(), request.profileId()));
            if (!exists) project.getApplications().add(new Application(project, request.profileId(), request.profileName(), request.profileEmail()));
            return ResponseEntity.ok(view(projects.save(project)));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/applications/{applicationId}/status")
    @Transactional
    public ResponseEntity<?> applicationStatus(@PathVariable Long id, @PathVariable Long applicationId, @RequestBody StatusRequest request, @RequestAttribute(value = "currentUser", required = false) UserAccount currentUser) {
        return projects.findById(id).map(project -> {
            if (!canManage(project, currentUser)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Você só pode gerenciar seus próprios projetos."));
            return project.getApplications().stream().filter(app -> Objects.equals(app.getId(), applicationId)).findFirst()
                .map(app -> { app.setStatus(request.status()); projects.save(project); return ResponseEntity.ok(view(project)); })
                .orElseGet(() -> ResponseEntity.notFound().build());
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    private void copy(ProjectRequest request, Project project) {
        project.setTitle(request.title()); project.setDescription(request.description()); project.setArea(request.area());
        project.setOwnerName(request.ownerName()); project.setOwnerEmail(request.ownerEmail());
    }

    private Map<String, Object> view(Project project) {
        return Map.of("id", project.getId(), "title", value(project.getTitle()), "description", value(project.getDescription()),
            "area", value(project.getArea()), "ownerName", value(project.getOwnerName()), "ownerEmail", value(project.getOwnerEmail()),
            "ownerUserId", project.getOwnerUserId() == null ? "" : project.getOwnerUserId(),
            "status", value(project.getStatus()), "requiredSkills", project.getRequiredSkills().stream().map(skill -> Map.<String, Object>of(
                "id", skill.getId(), "skillName", value(skill.getSkillName()), "requiredLevel", value(skill.getRequiredLevel()))).toList(),
            "applications", project.getApplications().stream().map(app -> Map.<String, Object>of("id", app.getId(), "profileId", app.getProfileId(),
                "profileName", value(app.getProfileName()), "profileEmail", value(app.getProfileEmail()), "status", value(app.getStatus()))).toList());
    }

    private static String value(String value) { return value == null ? "" : value; }
    private static String defaultValue(String value, String fallback) { return blank(value) ? fallback : value; }
    private static boolean blank(String value) { return value == null || value.isBlank(); }
    private static boolean canManage(Project project, UserAccount currentUser) {
        if (currentUser == null) return true;
        if (project.getOwnerUserId() != null) return project.getOwnerUserId().equals(currentUser.getId());
        return project.getOwnerEmail() != null && project.getOwnerEmail().equalsIgnoreCase(currentUser.getEmail());
    }

    private void claimLegacyOwnership(Project project, UserAccount currentUser) {
        if (project.getOwnerUserId() == null && canManage(project, currentUser)) {
            project.setOwnerUserId(currentUser.getId());
            projects.save(project);
        }
    }

    public record ProjectRequest(String title, String description, String area, String ownerName, String ownerEmail) {}
    public record RequiredSkillRequest(String skillName, String requiredLevel) {}
    public record ApplicationRequest(Long profileId, String profileName, String profileEmail) {}
    public record StatusRequest(String status) {}
}
