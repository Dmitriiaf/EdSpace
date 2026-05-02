package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "student_rate", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"student_id", "tutor_id"})
})
public class StudentRate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnore
    private Student student;

    @ManyToOne
    @JoinColumn(name = "tutor_id", nullable = false)
    private Tutor tutor;

    @Column(name = "rate_per_lesson", precision = 10, scale = 2)
    private BigDecimal ratePerLesson;

    @Column(name = "payment_type", length = 50)
    private String paymentType = "single";

    public StudentRate() {}

    public StudentRate(Student student, Tutor tutor, BigDecimal ratePerLesson) {
        this.student = student;
        this.tutor = tutor;
        this.ratePerLesson = ratePerLesson;
    }

    public StudentRate(Student student, Tutor tutor, BigDecimal ratePerLesson, String paymentType) {
        this.student = student;
        this.tutor = tutor;
        this.ratePerLesson = ratePerLesson;
        this.paymentType = paymentType;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
    }

    public Tutor getTutor() {
        return tutor;
    }

    public void setTutor(Tutor tutor) {
        this.tutor = tutor;
    }

    public BigDecimal getRatePerLesson() {
        return ratePerLesson;
    }

    public void setRatePerLesson(BigDecimal ratePerLesson) {
        this.ratePerLesson = ratePerLesson;
    }

    public String getPaymentType() {
        return paymentType;
    }

    public void setPaymentType(String paymentType) {
        this.paymentType = paymentType;
    }
}