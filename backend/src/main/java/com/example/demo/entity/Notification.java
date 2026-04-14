package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notification")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"}) // ✅ ДОБАВИТЬ ЭТУ СТРОКУ
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id", nullable = true)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"}) // ✅ ДОБАВИТЬ
    private Parent parent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = true)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"}) // ✅ ДОБАВИТЬ
    private Lesson lesson;

    @Column(nullable = false, length = 1000)
    private String message;

    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "tutor_id", nullable = true)
    private Long tutorId;

    // Конструкторы
    public Notification() {
        this.createdAt = LocalDateTime.now();
    }

    public Notification(Parent parent, Lesson lesson, String message) {
        this.parent = parent;
        this.lesson = lesson;
        this.message = message;
        this.isRead = false;
        this.createdAt = LocalDateTime.now();
    }

    // Геттеры и сеттеры (оставьте существующие)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Parent getParent() { return parent; }
    public void setParent(Parent parent) { this.parent = parent; }

    public Lesson getLesson() { return lesson; }
    public void setLesson(Lesson lesson) { this.lesson = lesson; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Long getTutorId() { return tutorId; }
    public void setTutorId(Long tutorId) { this.tutorId = tutorId; }
}