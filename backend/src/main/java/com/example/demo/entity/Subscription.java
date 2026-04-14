package com.example.demo.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "subscription")
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "tutor_id", nullable = false)
    private Tutor tutor;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "lessons_count")
    private Integer lessonsCount;

    @Column(name = "lessons_used")
    private Integer lessonsUsed = 0;

    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    private String status = "pending"; // pending, active, completed, cancelled

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    public Subscription() {}

    public Subscription(Tutor tutor, Student student, Integer lessonsCount,
                        BigDecimal price, LocalDate startDate, LocalDate endDate) {
        this.tutor = tutor;
        this.student = student;
        this.lessonsCount = lessonsCount;
        this.lessonsUsed = 0;
        this.price = price;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = "pending";
        this.createdAt = LocalDateTime.now();
    }

    // Геттеры
    public Long getId() { return id; }
    public Tutor getTutor() { return tutor; }
    public Student getStudent() { return student; }
    public Integer getLessonsCount() { return lessonsCount; }
    public Integer getLessonsUsed() { return lessonsUsed; }
    public BigDecimal getPrice() { return price; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getPaidAt() { return paidAt; }

    // Сеттеры
    public void setTutor(Tutor tutor) { this.tutor = tutor; }
    public void setStudent(Student student) { this.student = student; }
    public void setLessonsCount(Integer lessonsCount) { this.lessonsCount = lessonsCount; }
    public void setLessonsUsed(Integer lessonsUsed) { this.lessonsUsed = lessonsUsed; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public void setStatus(String status) { this.status = status; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }
}