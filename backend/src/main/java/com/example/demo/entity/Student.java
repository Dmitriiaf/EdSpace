package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "student")
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToMany(fetch = FetchType.LAZY)  // ✅ Изменено на LAZY
    @JoinTable(
            name = "student_tutor",
            joinColumns = @JoinColumn(name = "student_id"),
            inverseJoinColumns = @JoinColumn(name = "tutor_id")
    )
    private List<Tutor> tutors = new ArrayList<>();

    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)  // ✅ Изменено на LAZY
    private List<StudentRate> rates = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "parent_id")
    private Parent parent;

    @Column(nullable = false)
    private String fullName;

    private String email;
    private String phone;
    private String parentName;
    private String parentPhone;

    @Column(name = "birthday")
    private LocalDate birthday;

    @Column(nullable = false)
    private String role = "ROLE_STUDENT";

    @Column(name = "payment_type", length = 50)
    private String paymentType = "single";

    @Column(name = "registration_completed")
    private Boolean registrationCompleted = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // ✅ НОВОЕ ПОЛЕ: хеш пароля для входа ученика
    @Column(name = "password_hash")
    @JsonIgnore  // Не отдаём на фронтенд
    private String passwordHash;

    public Student() {}

    public Student(String fullName, String email, String phone,
                   String parentName, String parentPhone) {
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.parentName = parentName;
        this.parentPhone = parentPhone;
        this.role = "ROLE_STUDENT";
        this.paymentType = "single";
        this.createdAt = LocalDateTime.now();
    }

    // Геттеры
    public Long getId() { return id; }
    public List<Tutor> getTutors() { return tutors; }
    public List<StudentRate> getRates() { return rates; }
    public Parent getParent() { return parent; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getParentName() { return parentName; }
    public String getParentPhone() { return parentPhone; }
    public LocalDate getBirthday() { return birthday; }
    public String getRole() { return role; }
    public Boolean getRegistrationCompleted() {return registrationCompleted;}
    public String getPaymentType() { return paymentType; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getPasswordHash() { return passwordHash; }  // ✅ Геттер для пароля

    // Сеттеры
    public void setId(Long id) { this.id = id; }
    public void setRegistrationCompleted(Boolean registrationCompleted) {this.registrationCompleted = registrationCompleted;}
    public void setTutors(List<Tutor> tutors) { this.tutors = tutors; }
    public void setRates(List<StudentRate> rates) { this.rates = rates; }
    public void setParent(Parent parent) { this.parent = parent; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public void setEmail(String email) { this.email = email; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setParentName(String parentName) { this.parentName = parentName; }
    public void setParentPhone(String parentPhone) { this.parentPhone = parentPhone; }
    public void setBirthday(LocalDate birthday) { this.birthday = birthday; }
    public void setRole(String role) { this.role = role; }
    public void setPaymentType(String paymentType) { this.paymentType = paymentType; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }  // ✅ Сеттер для пароля

    public void addTutor(Tutor tutor) {
        if (this.tutors == null) {
            this.tutors = new ArrayList<>();
        }
        if (!this.tutors.contains(tutor)) {
            this.tutors.add(tutor);
        }
    }

    public void removeTutor(Tutor tutor) {
        if (this.tutors != null) {
            this.tutors.remove(tutor);
        }
    }

    public BigDecimal getRateForTutor(Long tutorId) {
        if (rates == null) return null;
        for (StudentRate rate : rates) {
            if (rate.getTutor() != null && rate.getTutor().getId().equals(tutorId)) {
                return rate.getRatePerLesson();
            }
        }
        return null;
    }

    public void setRateForTutor(Tutor tutor, BigDecimal rate) {
        if (this.rates == null) {
            this.rates = new ArrayList<>();
        }

        for (StudentRate sr : rates) {
            if (sr.getTutor() != null && sr.getTutor().getId().equals(tutor.getId())) {
                sr.setRatePerLesson(rate);
                return;
            }
        }

        StudentRate newRate = new StudentRate(this, tutor, rate);
        rates.add(newRate);
    }

    @Transient
    public BigDecimal getRatePerLesson() {
        if (rates != null && !rates.isEmpty()) {
            return rates.get(0).getRatePerLesson();
        }
        return null;
    }
}