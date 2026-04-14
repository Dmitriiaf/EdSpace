package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "progress_record")
public class ProgressRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne
    @JoinColumn(name = "course_id")
    private Course course;

    @ManyToOne
    @JoinColumn(name = "homework_id")
    private Homework homework;

    @Column(nullable = false)
    private String topic;           // Тема занятия

    @Column(name = "score")
    private Integer score;           // Баллы за тему (0-100)

    @Column(name = "grade")
    private Integer grade;           // Оценка (1-5)

    @Column(name = "record_date", nullable = false)
    private LocalDateTime recordDate;

    @Column(length = 1000)
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public ProgressRecord() {
        this.createdAt = LocalDateTime.now();
        this.recordDate = LocalDateTime.now();
    }

    public ProgressRecord(Student student, Course course, String topic, Integer score, Integer grade) {
        this();
        this.student = student;
        this.course = course;
        this.topic = topic;
        this.score = score;
        this.grade = grade;
    }

    // Геттеры
    public Long getId() { return id; }
    public Student getStudent() { return student; }
    public Course getCourse() { return course; }
    public Homework getHomework() { return homework; }
    public String getTopic() { return topic; }
    public Integer getScore() { return score; }
    public Integer getGrade() { return grade; }
    public LocalDateTime getRecordDate() { return recordDate; }
    public String getNotes() { return notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // Сеттеры
    public void setStudent(Student student) { this.student = student; }
    public void setCourse(Course course) { this.course = course; }
    public void setHomework(Homework homework) { this.homework = homework; }
    public void setTopic(String topic) { this.topic = topic; }
    public void setScore(Integer score) { this.score = score; }
    public void setGrade(Integer grade) { this.grade = grade; }
    public void setRecordDate(LocalDateTime recordDate) { this.recordDate = recordDate; }
    public void setNotes(String notes) { this.notes = notes; }
}