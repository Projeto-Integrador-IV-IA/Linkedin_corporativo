package br.com.linkedincorporativo.project.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_accounts")
public class UserAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String email;
    private String passwordHash;
    private String displayName;
    private String role = "RECRUITER";
    private Long profileId;
    private String sessionToken;

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public void setEmail(String value) { this.email = value; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String value) { this.passwordHash = value; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String value) { this.displayName = value; }
    public String getRole() { return role; }
    public void setRole(String value) { this.role = value; }
    public Long getProfileId() { return profileId; }
    public void setProfileId(Long value) { this.profileId = value; }
    public String getSessionToken() { return sessionToken; }
    public void setSessionToken(String value) { this.sessionToken = value; }
}
