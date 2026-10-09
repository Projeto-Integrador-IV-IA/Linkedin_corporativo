package br.com.linkedincorporativo.project.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "conversations")
public class Conversation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long projectId;
    private String projectTitle;
    private Long recruiterUserId;
    private Long professionalProfileId;
    private String professionalName;
    private String professionalEmail;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant recruiterReadAt;
    private Instant professionalReadAt;

    public Conversation() {}
    public Conversation(Long projectId, String projectTitle, Long recruiterUserId, Long professionalProfileId, String professionalName, String professionalEmail) {
        this.projectId = projectId;
        this.projectTitle = projectTitle;
        this.recruiterUserId = recruiterUserId;
        this.professionalProfileId = professionalProfileId;
        this.professionalName = professionalName;
        this.professionalEmail = professionalEmail;
    }
    @PrePersist public void beforeCreate() { createdAt = Instant.now(); updatedAt = createdAt; }
    @PreUpdate public void beforeUpdate() { updatedAt = Instant.now(); }
    public Long getId() { return id; }
    public Long getProjectId() { return projectId; }
    public String getProjectTitle() { return projectTitle; }
    public Long getRecruiterUserId() { return recruiterUserId; }
    public Long getProfessionalProfileId() { return professionalProfileId; }
    public String getProfessionalName() { return professionalName; }
    public String getProfessionalEmail() { return professionalEmail; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public Instant getRecruiterReadAt() { return recruiterReadAt; }
    public void setRecruiterReadAt(Instant value) { this.recruiterReadAt = value; }
    public Instant getProfessionalReadAt() { return professionalReadAt; }
    public void setProfessionalReadAt(Instant value) { this.professionalReadAt = value; }
}
