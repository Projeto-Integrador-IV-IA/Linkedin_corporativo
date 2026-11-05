package br.com.linkedincorporativo.project;

import br.com.linkedincorporativo.project.domain.UserAccount;
import br.com.linkedincorporativo.project.domain.PasswordResetToken;
import br.com.linkedincorporativo.project.repository.PasswordResetTokenRepository;
import br.com.linkedincorporativo.project.repository.UserAccountRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
    private final UserAccountRepository users;
    private final PasswordResetTokenRepository resetTokens;
    private final PasswordResetMailService passwordResetMail;
    private final int resetExpirationMinutes;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthService(
        UserAccountRepository users,
        PasswordResetTokenRepository resetTokens,
        PasswordResetMailService passwordResetMail,
        @org.springframework.beans.factory.annotation.Value("${security.password-reset.expiration-minutes:30}") int resetExpirationMinutes
    ) {
        this.users = users;
        this.resetTokens = resetTokens;
        this.passwordResetMail = passwordResetMail;
        this.resetExpirationMinutes = Math.max(5, Math.min(resetExpirationMinutes, 1_440));
    }

    public UserAccount authenticate(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Faça login para continuar.");
        }
        String token = authorization.substring("Bearer ".length()).trim();
        return users.findBySessionToken(token)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sessão inválida ou expirada."));
    }

    public UserAccount register(String email, String password, String displayName) {
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
        user.setRole("MEMBER");
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

    public UserAccount linkProfile(UserAccount user, Long profileId) {
        user.setProfileId(profileId);
        return users.save(user);
    }

    @Transactional
    public UserAccount changePassword(UserAccount user, String currentPassword, String newPassword) {
        if (!encoder.matches(currentPassword == null ? "" : currentPassword, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "A senha atual informada está incorreta.");
        }
        validatePassword(newPassword);
        if (encoder.matches(newPassword, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Escolha uma senha diferente da atual.");
        }
        user.setPasswordHash(encoder.encode(newPassword));
        resetTokens.deleteByUserId(user.getId());
        return issueToken(user);
    }

    @Transactional
    public void requestPasswordReset(String email) {
        if (email == null || email.isBlank()) return;
        users.findByEmailIgnoreCase(email.trim()).ifPresent(user -> {
            resetTokens.deleteByUserId(user.getId());
            String rawToken = UUID.randomUUID().toString() + UUID.randomUUID();
            PasswordResetToken token = new PasswordResetToken();
            token.setUserId(user.getId());
            token.setTokenHash(hash(rawToken));
            token.setExpiresAt(Instant.now().plus(resetExpirationMinutes, ChronoUnit.MINUTES));
            resetTokens.save(token);
            passwordResetMail.send(user.getEmail(), rawToken, resetExpirationMinutes);
        });
    }

    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        validatePassword(newPassword);
        PasswordResetToken token = resetTokens.findByTokenHashAndUsedAtIsNull(hash(rawToken))
            .orElseThrow(() -> invalidResetToken());
        if (token.getExpiresAt().isBefore(Instant.now())) {
            resetTokens.delete(token);
            throw invalidResetToken();
        }
        UserAccount user = users.findById(token.getUserId()).orElseThrow(this::invalidResetToken);
        user.setPasswordHash(encoder.encode(newPassword));
        user.setSessionToken(null);
        token.setUsedAt(Instant.now());
        users.save(user);
        resetTokens.save(token);
    }

    private void validatePassword(String password) {
        if (password == null || password.length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A nova senha precisa ter pelo menos 8 caracteres.");
        }
    }

    private ResponseStatusException invalidResetToken() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, "O link de recuperação é inválido ou expirou. Solicite um novo e-mail.");
    }

    private static String hash(String value) {
        if (value == null || value.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O link de recuperação é inválido ou expirou. Solicite um novo e-mail.");
        try {
            return java.util.HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("Algoritmo de segurança indisponível.", exception);
        }
    }

    private UserAccount issueToken(UserAccount user) {
        user.setSessionToken(UUID.randomUUID().toString() + UUID.randomUUID());
        return users.save(user);
    }
}
