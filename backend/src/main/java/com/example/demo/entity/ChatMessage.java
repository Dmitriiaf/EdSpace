package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_message")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    @Column(name = "sender_role", nullable = false, length = 30)
    private String senderRole;

    @Column(name = "recipient_id", nullable = false)
    private Long recipientId;

    @Column(name = "recipient_role", nullable = false, length = 30)
    private String recipientRole;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public ChatMessage() {}

    public ChatMessage(Long senderId, String senderRole, Long recipientId, String recipientRole, String text) {
        this.senderId = senderId;
        this.senderRole = senderRole;
        this.recipientId = recipientId;
        this.recipientRole = recipientRole;
        this.text = text;
        this.isRead = false;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getSenderId() { return senderId; }
    public String getSenderRole() { return senderRole; }
    public Long getRecipientId() { return recipientId; }
    public String getRecipientRole() { return recipientRole; }
    public String getText() { return text; }
    public Boolean getIsRead() { return isRead; }
    public void setIsRead(Boolean isRead) { this.isRead = isRead; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}