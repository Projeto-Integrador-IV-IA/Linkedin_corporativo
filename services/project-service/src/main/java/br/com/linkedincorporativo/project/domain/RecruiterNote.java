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
@Table(name = "recruiter_notes")
public class RecruiterNote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long conversationId;
    private Long recruiterUserId;
    private String content;
    private Instant updatedAt;

    public RecruiterNote() {}
    public RecruiterNote(Long conversationId, Long recruiterUserId, String content) {
        this.conversationId = conversationId;
        this.recruiterUserId = recruiterUserId;
        this.content = content;
    }
    @PrePersist @PreUpdate public void touch() { updatedAt = Instant.now(); }
    public Long getId() { return id; }
    public Long getConversationId() { return conversationId; }
    public Long getRecruiterUserId() { return recruiterUserId; }
    public String getContent() { return content; }
    public void setContent(String value) { this.content = value; }
    public Instant getUpdatedAt() { return updatedAt; }
}
