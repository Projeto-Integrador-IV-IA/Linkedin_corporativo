package br.com.linkedincorporativo.project.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(nullable = false)
    private Instant expiresAt;

    private Instant usedAt;

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long value) { userId = value; }
    public String getTokenHash() { return tokenHash; }
    public void setTokenHash(String value) { tokenHash = value; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant value) { expiresAt = value; }
    public Instant getUsedAt() { return usedAt; }
    public void setUsedAt(Instant value) { usedAt = value; }
}
