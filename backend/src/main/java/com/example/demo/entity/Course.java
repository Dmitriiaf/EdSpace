package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "course")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @ManyToOne
    @JoinColumn(name = "tutor_id", nullable = false)
    @JsonIgnore
    private Tutor tutor;

    @Column(nullable = false)
    private String name;

    private String description;

    private String color;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @JsonIgnore
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "course_student",
            joinColumns = @JoinColumn(name = "course_id"),
            inverseJoinColumns = @JoinColumn(name = "student_id")
    )
    private List<Student> enrolledStudents = new ArrayList<>();

    public Course() {}

    public Course(String name, String color, Tutor tutor) {
        this.name = name;
        this.color = color;
        this.tutor = tutor;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Tutor getTutor() {
        return tutor;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public String getColor() {
        return color;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public List<Student> getEnrolledStudents() {
        return enrolledStudents;
    }

    // ✅ ДОБАВЛЕНО: геттер и сеттер для subject
    public Subject getSubject() {
        return subject;
    }

    public void setSubject(Subject subject) {
        this.subject = subject;
    }

    public void setTutor(Tutor tutor) {
        this.tutor = tutor;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public void setEnrolledStudents(List<Student> enrolledStudents) {
        this.enrolledStudents = enrolledStudents;
    }

    public void addStudent(Student student) {
        if (this.enrolledStudents == null) this.enrolledStudents = new ArrayList<>();
        this.enrolledStudents.add(student);
    }

    public void removeStudent(Student student) {
        if (this.enrolledStudents != null) this.enrolledStudents.remove(student);
    }
}