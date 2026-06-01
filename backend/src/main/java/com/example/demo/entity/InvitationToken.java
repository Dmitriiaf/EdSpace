package com.example.demo.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "invitation_token")
public class InvitationToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(nullable = false)
    private String email;

    @Column(name = "user_type", nullable = false)
    private String userType; // STUDENT или PARENT

    @Column(name = "student_id")
    private Long studentId;

    @Column(name = "student_name")
    private String studentName;

    @Column(name = "tutor_id", nullable = false)
    private Long tutorId;

    @Column(name = "rate_per_lesson")
    private BigDecimal ratePerLesson;

    @Column(name = "payment_type")
    private String paymentType;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private Boolean used = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    // ✅ REG-1: Подтверждение email кодом
    @Column(name = "verification_code", length = 10)
    private String verificationCode;

    @Column(name = "verification_code_expiry")
    private LocalDateTime verificationCodeExpiry;

    public InvitationToken() {
        this.token = UUID.randomUUID().toString();
        this.createdAt = LocalDateTime.now();
        this.expiresAt = LocalDateTime.now().plusDays(7);
        this.used = false;
    }

    // Геттеры и сеттеры
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getUserType() { return userType; }
    public void setUserType(String userType) { this.userType = userType; }

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public Long getTutorId() { return tutorId; }
    public void setTutorId(Long tutorId) { this.tutorId = tutorId; }

    public BigDecimal getRatePerLesson() { return ratePerLesson; }
    public void setRatePerLesson(BigDecimal ratePerLesson) { this.ratePerLesson = ratePerLesson; }

    public String getPaymentType() { return paymentType; }
    public void setPaymentType(String paymentType) { this.paymentType = paymentType; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public Boolean getUsed() { return used; }
    public void setUsed(Boolean used) { this.used = used; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    // ✅ REG-1: Геттеры и сеттеры для кода
    public String getVerificationCode() { return verificationCode; }
    public void setVerificationCode(String verificationCode) { this.verificationCode = verificationCode; }
    public LocalDateTime getVerificationCodeExpiry() { return verificationCodeExpiry; }
    public void setVerificationCodeExpiry(LocalDateTime verificationCodeExpiry) { this.verificationCodeExpiry = verificationCodeExpiry; }
}