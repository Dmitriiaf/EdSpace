package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_board", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"student_id", "tutor_id"})
})
public class StudentBoard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tutor_id", nullable = false)
    private Tutor tutor;

    @Column(columnDefinition = "TEXT")
    private String notes = "[]";

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public StudentBoard() {}

    public StudentBoard(Student student, Tutor tutor) {
        this.student = student;
        this.tutor = tutor;
        this.notes = "[{\"id\":1,\"text\":\"🎯 Цели\",\"color\":\"#FFF9C4\"},{\"id\":2,\"text\":\"📋 Задачи\",\"color\":\"#C8E6C9\"}]";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Student getStudent() { return student; }
    public void setStudent(Student student) { this.student = student; }
    public Tutor getTutor() { return tutor; }
    public void setTutor(Tutor tutor) { this.tutor = tutor; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; this.updatedAt = LocalDateTime.now(); }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}