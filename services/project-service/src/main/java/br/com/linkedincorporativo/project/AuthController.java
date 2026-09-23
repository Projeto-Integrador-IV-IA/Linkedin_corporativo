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
import org.springframework.web.server.ResponseStatusException;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    private final AuthService auth;
    private final String resetKey;

    public AuthController(AuthService auth, @Value("${auth.reset-key:}") String resetKey) {
        this.auth = auth;
        this.resetKey = resetKey;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Credentials request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(view(auth.register(request.email(), request.password(), request.displayName(), request.role())));
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            log.error("Falha inesperada ao cadastrar usuário com e-mail {}", safeEmail(request), exception);
            throw exception;
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Credentials request) {
        try {
            return ResponseEntity.ok(view(auth.login(request.email(), request.password())));
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            log.error("Falha inesperada ao autenticar usuário com e-mail {}", safeEmail(request), exception);
            throw exception;
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
        @RequestHeader(value = "X-Auth-Reset-Key", required = false) String providedKey,
        @RequestBody ResetPasswordRequest request
    ) {
        if (resetKey.isBlank() || providedKey == null || !resetKey.equals(providedKey)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Reset de senha desabilitado ou não autorizado."));
        }
        try {
            UserAccount user = auth.resetPassword(request.email(), request.newPassword());
            return ResponseEntity.ok(view(user));
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            log.error("Falha inesperada ao redefinir senha para {}", safeEmail(request), exception);
            throw exception;
        }
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

    private String safeEmail(Credentials request) {
        return request == null || request.email() == null ? "<vazio>" : request.email().trim();
    }

    private String safeEmail(ResetPasswordRequest request) {
        return request == null || request.email() == null ? "<vazio>" : request.email().trim();
    }

    public record Credentials(String email, String password, String displayName, String role) {}
    public record ResetPasswordRequest(String email, String newPassword) {}
    public record ProfileLink(Long profileId) {}
}
