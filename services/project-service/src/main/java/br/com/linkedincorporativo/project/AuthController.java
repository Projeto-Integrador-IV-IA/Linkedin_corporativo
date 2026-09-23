package br.com.linkedincorporativo.project;

import br.com.linkedincorporativo.project.domain.UserAccount;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;

    public AuthController(AuthService auth) { this.auth = auth; }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Credentials request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(view(auth.register(request.email(), request.password(), request.displayName(), request.role())));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Credentials request) {
        return ResponseEntity.ok(view(auth.login(request.email(), request.password())));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(view(auth.authenticate(authorization)));
    }

    @PatchMapping("/profile")
    public ResponseEntity<?> linkProfile(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestBody ProfileLink request
    ) {
        UserAccount user = auth.authenticate(authorization);
        user.setProfileId(request.profileId());
        return ResponseEntity.ok(view(user));
    }

    private Map<String, Object> view(UserAccount user) {
        return Map.of(
            "id", user.getId(),
            "email", text(user.getEmail()),
            "displayName", text(user.getDisplayName()),
            "role", text(user.getRole()),
            "profileId", user.getProfileId() == null ? "" : user.getProfileId(),
            "token", text(user.getSessionToken())
        );
    }

    private String text(String value) {
        return value == null ? "" : value;
    }

    public record Credentials(String email, String password, String displayName, String role) {}
    public record ProfileLink(Long profileId) {}
}
