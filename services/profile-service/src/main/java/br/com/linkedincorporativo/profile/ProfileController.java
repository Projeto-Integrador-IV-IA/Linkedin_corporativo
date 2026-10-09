package br.com.linkedincorporativo.profile;

import br.com.linkedincorporativo.profile.domain.PortfolioProject;
import br.com.linkedincorporativo.profile.domain.Profile;
import br.com.linkedincorporativo.profile.repository.ProfileRepository;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class ProfileController {
    private final ProfileRepository profiles;

    public ProfileController(ProfileRepository profiles) {
        this.profiles = profiles;
    }

    @GetMapping("/profiles")
    @Transactional
    @Cacheable(cacheNames = "profiles", key = "'all'")
    public List<Map<String, Object>> listProfiles() {
        return profiles.findAll().stream().map(this::profileView).toList();
    }

    @GetMapping("/profiles/{id}")
    @Transactional
    @Cacheable(cacheNames = "profiles", key = "#id")
    public ResponseEntity<?> getProfile(@PathVariable Long id) {
        return profiles.findById(id)
            .<ResponseEntity<?>>map(profile -> ResponseEntity.ok(profileView(profile)))
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/profiles")
    @CacheEvict(cacheNames = "profiles", allEntries = true)
    public ResponseEntity<?> createProfile(@RequestBody ProfileRequest request) {
        if (blank(request.fullName()) || blank(request.email())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Nome e e-mail são obrigatórios."));
        }
        String email = normalizeEmail(request.email());
        if (profiles.findByEmailIgnoreCase(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Já existe um perfil para este e-mail de login."));
        }
        Profile profile = new Profile();
        copyProfile(request, profile);
        return ResponseEntity.status(HttpStatus.CREATED).body(profileView(profiles.save(profile)));
    }

    @PutMapping("/profiles/{id}")
    @CacheEvict(cacheNames = "profiles", allEntries = true)
    public ResponseEntity<?> updateProfile(@PathVariable Long id, @RequestBody ProfileRequest request) {
        return profiles.findById(id).map(profile -> {
            String email = normalizeEmail(request.email());
            var anotherProfile = profiles.findByEmailIgnoreCase(email);
            if (anotherProfile.isPresent() && !anotherProfile.get().getId().equals(id)) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Já existe um perfil para este e-mail de login."));
            }
            copyProfile(request, profile);
            return ResponseEntity.ok(profileView(profiles.save(profile)));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/profiles/{id}")
    @CacheEvict(cacheNames = "profiles", allEntries = true)
    public ResponseEntity<Void> deleteProfile(@PathVariable Long id) {
        if (!profiles.existsById(id)) return ResponseEntity.notFound().build();
        profiles.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/profiles/{id}/portfolio")
    @Transactional
    @CacheEvict(cacheNames = "profiles", allEntries = true)
    public ResponseEntity<?> addPortfolio(@PathVariable Long id, @RequestBody PortfolioRequest request) {
        return profiles.findById(id).map(profile -> {
            PortfolioProject item = request.sourceProjectId() == null
                ? new PortfolioProject(profile, request.title(), request.description(), "")
                : profile.getPortfolioProjects().stream().filter(project -> Objects.equals(project.getSourceProjectId(), request.sourceProjectId())).findFirst()
                    .orElseGet(() -> new PortfolioProject(profile, request.title(), request.description(), ""));
            item.setTitle(request.title());
            item.setDescription(request.description());
            item.setTechnologies("");
            item.setSourceProjectId(request.sourceProjectId());
            if (!profile.getPortfolioProjects().contains(item)) profile.getPortfolioProjects().add(item);
            return ResponseEntity.ok(profileView(profiles.save(profile)));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/profiles/{id}/portfolio/{portfolioId}")
    @Transactional
    @CacheEvict(cacheNames = "profiles", allEntries = true)
    public ResponseEntity<?> updatePortfolio(@PathVariable Long id, @PathVariable Long portfolioId, @RequestBody PortfolioRequest request) {
        return profiles.findById(id).map(profile -> profile.getPortfolioProjects().stream()
            .filter(item -> Objects.equals(item.getId(), portfolioId))
            .findFirst()
            .map(item -> {
                item.setTitle(request.title());
                item.setDescription(request.description());
                item.setTechnologies("");
                return ResponseEntity.ok(profileView(profiles.save(profile)));
            })
            .orElseGet(() -> ResponseEntity.notFound().build())
        ).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/profiles/{id}/portfolio/{portfolioId}")
    @Transactional
    @CacheEvict(cacheNames = "profiles", allEntries = true)
    public ResponseEntity<Void> removePortfolio(@PathVariable Long id, @PathVariable Long portfolioId) {
        return profiles.findById(id).map(profile -> {
            profile.getPortfolioProjects().removeIf(item -> Objects.equals(item.getId(), portfolioId));
            profiles.save(profile);
            return ResponseEntity.noContent().<Void>build();
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/profiles/{id}/portfolio/source-project/{sourceProjectId}")
    @Transactional
    @CacheEvict(cacheNames = "profiles", allEntries = true)
    public ResponseEntity<Void> removePortfolioBySourceProject(@PathVariable Long id, @PathVariable Long sourceProjectId) {
        return profiles.findById(id).map(profile -> {
            profile.getPortfolioProjects().removeIf(item -> Objects.equals(item.getSourceProjectId(), sourceProjectId));
            profiles.save(profile);
            return ResponseEntity.noContent().<Void>build();
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    private void copyProfile(ProfileRequest request, Profile profile) {
        if (request.avatarUrl() != null && request.avatarUrl().length() > 700_000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A foto de perfil deve ter no máximo 512 KB.");
        }
        profile.setFullName(request.fullName());
        profile.setEmail(request.email() == null ? "" : request.email().trim().toLowerCase());
        profile.setProfession(request.profession());
        profile.setEducationLevel(defaultValue(request.educationLevel(), "GRADUACAO"));
        profile.setYearsOfExperience(request.yearsOfExperience() == null ? 0 : request.yearsOfExperience());
        profile.setBio(request.bio());
        profile.setAvatarUrl(request.avatarUrl());
    }

    private Map<String, Object> profileView(Profile profile) {
        return Map.of(
            "id", profile.getId(),
            "fullName", profile.getFullName(),
            "email", profile.getEmail(),
            "profession", value(profile.getProfession()),
            "educationLevel", value(profile.getEducationLevel()),
            "yearsOfExperience", profile.getYearsOfExperience() == null ? 0 : profile.getYearsOfExperience(),
            "bio", value(profile.getBio()),
            "avatarUrl", value(profile.getAvatarUrl()),
            "portfolioProjects", profile.getPortfolioProjects().stream().map(this::portfolioView).toList()
        );
    }

    private Map<String, Object> portfolioView(PortfolioProject item) {
        return Map.of("id", item.getId(), "title", value(item.getTitle()), "description", value(item.getDescription()),
            "sourceProjectId", item.getSourceProjectId() == null ? "" : item.getSourceProjectId());
    }

    private static String value(String value) { return value == null ? "" : value; }
    private static String normalizeEmail(String value) { return value == null ? "" : value.trim().toLowerCase(); }
    private static String defaultValue(String value, String fallback) { return blank(value) ? fallback : value; }
    private static boolean blank(String value) { return value == null || value.isBlank(); }

    public record ProfileRequest(String fullName, String email, String profession, String educationLevel, Integer yearsOfExperience, String bio, String avatarUrl) {}
    public record PortfolioRequest(Long sourceProjectId, String title, String description) {}
}
