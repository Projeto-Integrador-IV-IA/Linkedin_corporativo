package br.com.linkedincorporativo.project;

import br.com.linkedincorporativo.project.domain.UserAccount;
import br.com.linkedincorporativo.project.repository.UserAccountRepository;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
    private final UserAccountRepository users;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthService(UserAccountRepository users) { this.users = users; }

    public UserAccount authenticate(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Faça login para continuar.");
        }
        String token = authorization.substring("Bearer ".length()).trim();
        return users.findBySessionToken(token)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sessão inválida ou expirada."));
    }

    public UserAccount register(String email, String password, String displayName, String role) {
        if (email == null || email.isBlank() || password == null || password.length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe um e-mail e uma senha com pelo menos 6 caracteres.");
        }
        if (users.findByEmailIgnoreCase(email.trim()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este e-mail já possui uma conta.");
        }
        UserAccount user = new UserAccount();
        user.setEmail(email.trim().toLowerCase());
        user.setPasswordHash(encoder.encode(password));
        user.setDisplayName(displayName == null || displayName.isBlank() ? email.trim() : displayName.trim());
        user.setRole(role == null || role.isBlank() ? "RECRUITER" : role.trim().toUpperCase());
        return issueToken(users.save(user));
    }

    public UserAccount login(String email, String password) {
        UserAccount user = users.findByEmailIgnoreCase(email == null ? "" : email.trim())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos."));
        if (!encoder.matches(password == null ? "" : password, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos.");
        }
        return issueToken(user);
    }

    private UserAccount issueToken(UserAccount user) {
        user.setSessionToken(UUID.randomUUID().toString() + UUID.randomUUID());
        return users.save(user);
    }
}
