package br.com.linkedincorporativo.project.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "candidate_decisions")
public class CandidateDecision {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;
    private Long profileId;
    private Long recruiterUserId;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;

    public CandidateDecision() {}
    public CandidateDecision(Project project, Long profileId, Long recruiterUserId, String status) {
        this.project = project;
        this.profileId = profileId;
        this.recruiterUserId = recruiterUserId;
        this.status = status;
    }
    @PrePersist public void beforeCreate() { createdAt = Instant.now(); updatedAt = createdAt; }
    @PreUpdate public void beforeUpdate() { updatedAt = Instant.now(); }
    public Long getId() { return id; }
    public Project getProject() { return project; }
    public Long getProfileId() { return profileId; }
    public Long getRecruiterUserId() { return recruiterUserId; }
    public String getStatus() { return status; }
    public void setStatus(String value) { this.status = value; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
