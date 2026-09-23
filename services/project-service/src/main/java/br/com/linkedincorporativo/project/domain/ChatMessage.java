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
@Table(name = "chat_messages")
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;
    private Long senderUserId;
    private String content;
    private Instant createdAt;

    public ChatMessage() {}
    public ChatMessage(Conversation conversation, Long senderUserId, String content) {
        this.conversation = conversation;
        this.senderUserId = senderUserId;
        this.content = content;
    }
    @PrePersist public void beforeCreate() { createdAt = Instant.now(); }
    public Long getId() { return id; }
    public Conversation getConversation() { return conversation; }
    public Long getSenderUserId() { return senderUserId; }
    public String getContent() { return content; }
    public Instant getCreatedAt() { return createdAt; }
}
