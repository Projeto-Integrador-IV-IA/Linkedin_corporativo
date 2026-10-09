package br.com.linkedincorporativo.project.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "llm_usage_records", indexes = {
    @Index(name = "idx_llm_usage_created_at", columnList = "created_at"),
    @Index(name = "idx_llm_usage_user_id", columnList = "user_id")
})
public class LlmUsageRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_id")
    private Long userId;
    private String contextType;
    private String requestType;
    private String provider;
    private String model;
    private Long inputTokens = 0L;
    private Long outputTokens = 0L;
    private Long cachedContextTokens = 0L;
    private Long reasoningTokens = 0L;
    private Long totalTokens = 0L;
    private Long latencyMs = 0L;
    private Boolean successful = false;
    private Integer statusCode;
    @Column(name = "created_at")
    private Instant createdAt;

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long value) { this.userId = value; }
    public String getContextType() { return contextType; }
    public void setContextType(String value) { this.contextType = value; }
    public String getRequestType() { return requestType; }
    public void setRequestType(String value) { this.requestType = value; }
    public String getProvider() { return provider; }
    public void setProvider(String value) { this.provider = value; }
    public String getModel() { return model; }
    public void setModel(String value) { this.model = value; }
    public Long getInputTokens() { return inputTokens; }
    public void setInputTokens(Long value) { this.inputTokens = value; }
    public Long getOutputTokens() { return outputTokens; }
    public void setOutputTokens(Long value) { this.outputTokens = value; }
    public Long getCachedContextTokens() { return cachedContextTokens; }
    public void setCachedContextTokens(Long value) { this.cachedContextTokens = value; }
    public Long getReasoningTokens() { return reasoningTokens; }
    public void setReasoningTokens(Long value) { this.reasoningTokens = value; }
    public Long getTotalTokens() { return totalTokens; }
    public void setTotalTokens(Long value) { this.totalTokens = value; }
    public Long getLatencyMs() { return latencyMs; }
    public void setLatencyMs(Long value) { this.latencyMs = value; }
    public Boolean getSuccessful() { return successful; }
    public void setSuccessful(Boolean value) { this.successful = value; }
    public Integer getStatusCode() { return statusCode; }
    public void setStatusCode(Integer value) { this.statusCode = value; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant value) { this.createdAt = value; }
}
