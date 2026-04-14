package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "homework")
public class Homework {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "tutor_id", nullable = false)
    private Tutor tutor;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(nullable = false, length = 5000)
    private String task;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(length = 2000)
    private String feedback;

    private Integer grade;          // Оценка (0-5 или 0-100)

    @Column(name = "score")
    private Integer score;          // Баллы (0-100)

    @Column(name = "max_score")
    private Integer maxScore;       // Максимальный балл

    @Column(name = "percentage")
    private Double percentage;      // Процент выполнения (score/maxScore * 100)

    private String attachments;

    @Column(nullable = false)
    private String status;          // assigned, submitted, checked, revision

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Homework() {}

    public Homework(Tutor tutor, Student student, String task, String status) {
        this.tutor = tutor;
        this.student = student;
        this.task = task;
        this.status = status;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Геттеры
    public Long getId() { return id; }
    public Tutor getTutor() { return tutor; }
    public Student getStudent() { return student; }
    public String getTask() { return task; }
    public LocalDateTime getDueDate() { return dueDate; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public String getFeedback() { return feedback; }
    public Integer getGrade() { return grade; }
    public Integer getScore() { return score; }
    public Integer getMaxScore() { return maxScore; }
    public Double getPercentage() { return percentage; }
    public String getAttachments() { return attachments; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // Сеттеры
    public void setTutor(Tutor tutor) {
        this.tutor = tutor;
        this.updatedAt = LocalDateTime.now();
    }

    public void setStudent(Student student) {
        this.student = student;
        this.updatedAt = LocalDateTime.now();
    }

    public void setTask(String task) {
        this.task = task;
        this.updatedAt = LocalDateTime.now();
    }

    public void setDueDate(LocalDateTime dueDate) {
        this.dueDate = dueDate;
        this.updatedAt = LocalDateTime.now();
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
        this.updatedAt = LocalDateTime.now();
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
        this.updatedAt = LocalDateTime.now();
    }

    public void setGrade(Integer grade) {
        this.grade = grade;
        this.updatedAt = LocalDateTime.now();
    }

    public void setScore(Integer score) {
        this.score = score;
        this.updatedAt = LocalDateTime.now();
        calculatePercentage();
    }

    public void setMaxScore(Integer maxScore) {
        this.maxScore = maxScore;
        this.updatedAt = LocalDateTime.now();
        calculatePercentage();
    }

    private void calculatePercentage() {
        if (score != null && maxScore != null && maxScore > 0) {
            this.percentage = (double) score / maxScore * 100;
        }
    }

    public void setAttachments(String attachments) {
        this.attachments = attachments;
        this.updatedAt = LocalDateTime.now();
    }

    public void setStatus(String status) {
        this.status = status;
        this.updatedAt = LocalDateTime.now();
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}