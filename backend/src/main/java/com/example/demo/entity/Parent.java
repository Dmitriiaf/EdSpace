package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "parent")
public class Parent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reset_token_expiry")
    private LocalDateTime resetTokenExpiry;

    @Column(name = "reset_token")
    private String resetToken;

    @Column(nullable = false)
    private String fullName;

    @Column(unique = true, nullable = false)
    private String email;

    private String phone;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private String role = "ROLE_PARENT";

    @OneToMany(mappedBy = "parent")
    @JsonIgnore
    private List<Student> children = new ArrayList<>();

    // ✅ НОВОЕ ПОЛЕ
    @Column(name = "registration_completed")
    private Boolean registrationCompleted = false;

    public Parent() {
        this.createdAt = LocalDateTime.now();
        this.registrationCompleted = false;
    }

    public Parent(String fullName, String email, String phone) {
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.createdAt = LocalDateTime.now();
        this.role = "ROLE_PARENT";
        this.registrationCompleted = false;
    }

    // Геттеры
    public String getResetToken() { return resetToken; }
    public LocalDateTime getResetTokenExpiry() { return resetTokenExpiry; }
    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getPasswordHash() { return passwordHash; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public List<Student> getChildren() { return children; }
    public String getRole() { return role; }
    public Boolean getRegistrationCompleted() { return registrationCompleted; }  // ✅ Геттер

    // Сеттеры
    public void setResetTokenExpiry(LocalDateTime resetTokenExpiry) { this.resetTokenExpiry = resetTokenExpiry; }
    public void setResetToken(String resetToken) { this.resetToken = resetToken; }
    public void setId(Long id) { this.id = id; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public void setEmail(String email) { this.email = email; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setChildren(List<Student> children) { this.children = children; }
    public void setRole(String role) { this.role = role; }
    public void setRegistrationCompleted(Boolean registrationCompleted) { this.registrationCompleted = registrationCompleted; }  // ✅ Сеттер
}