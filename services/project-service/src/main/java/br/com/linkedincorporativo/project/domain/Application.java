package br.com.linkedincorporativo.project.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "project_applications")
public class Application {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;
    private Long userId;
    private Long profileId;
    private String profileName;
    private String profileEmail;
    private String status = "PENDENTE";
    private Instant createdAt;

    public Application() {}
    public Application(Project project, Long profileId, String profileName, String profileEmail) {
        this.project = project;
        this.profileId = profileId;
        this.profileName = profileName;
        this.profileEmail = profileEmail;
    }
    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long value) { this.userId = value; }
    public Long getProfileId() { return profileId; }
    public String getProfileName() { return profileName; }
    public String getProfileEmail() { return profileEmail; }
    public String getStatus() { return status; }
    public void setStatus(String value) { this.status = value; }
    public Instant getCreatedAt() { return createdAt; }
    @PrePersist public void beforeCreate() { if (createdAt == null) createdAt = Instant.now(); }
}
