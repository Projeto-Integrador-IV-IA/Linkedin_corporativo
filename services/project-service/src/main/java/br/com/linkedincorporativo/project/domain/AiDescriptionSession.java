package br.com.linkedincorporativo.project.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "ai_description_sessions")
public class AiDescriptionSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long userId;
    private String contextType;
    private String status;
    private Integer versionCount = 0;
    @Column(columnDefinition = "TEXT")
    private String currentText;
    @Column(columnDefinition = "TEXT")
    private String questionsJson;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant cooldownUntil;

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long value) { this.userId = value; }
    public String getContextType() { return contextType; }
    public void setContextType(String value) { this.contextType = value; }
    public String getStatus() { return status; }
    public void setStatus(String value) { this.status = value; }
    public Integer getVersionCount() { return versionCount; }
    public void setVersionCount(Integer value) { this.versionCount = value; }
    public String getCurrentText() { return currentText; }
    public void setCurrentText(String value) { this.currentText = value; }
    public String getQuestionsJson() { return questionsJson; }
    public void setQuestionsJson(String value) { this.questionsJson = value; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant value) { this.createdAt = value; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant value) { this.updatedAt = value; }
    public Instant getCooldownUntil() { return cooldownUntil; }
    public void setCooldownUntil(Instant value) { this.cooldownUntil = value; }
}
