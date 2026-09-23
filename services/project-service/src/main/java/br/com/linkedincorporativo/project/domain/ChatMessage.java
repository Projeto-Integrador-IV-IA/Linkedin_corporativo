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
import jakarta.persistence.Column;
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
    @Column(length = 255)
    private String attachmentName;
    private String attachmentContentType;
    private Long attachmentSize;
    private String attachmentPath;
    private Instant createdAt;

    public ChatMessage() {}
    public ChatMessage(Conversation conversation, Long senderUserId, String content) {
        this.conversation = conversation;
        this.senderUserId = senderUserId;
        this.content = content;
    }
    public void setAttachment(String name, String contentType, long size, String path) {
        this.attachmentName = name;
        this.attachmentContentType = contentType;
        this.attachmentSize = size;
        this.attachmentPath = path;
    }
    @PrePersist public void beforeCreate() { createdAt = Instant.now(); }
    public Long getId() { return id; }
    public Conversation getConversation() { return conversation; }
    public Long getSenderUserId() { return senderUserId; }
    public String getContent() { return content; }
    public String getAttachmentName() { return attachmentName; }
    public String getAttachmentContentType() { return attachmentContentType; }
    public Long getAttachmentSize() { return attachmentSize; }
    public String getAttachmentPath() { return attachmentPath; }
    public Instant getCreatedAt() { return createdAt; }
}
