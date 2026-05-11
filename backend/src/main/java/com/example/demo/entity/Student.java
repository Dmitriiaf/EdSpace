// ========== backend/src/main/java/com/example/demo/entity/Student.java (ИСПРАВЛЕННАЯ ВЕРСИЯ) ==========
package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "student")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "tutors", "courses"})
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "student_tutor",
            joinColumns = @JoinColumn(name = "student_id"),
            inverseJoinColumns = @JoinColumn(name = "tutor_id")
    )
    private List<Tutor> tutors = new ArrayList<>();

    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<StudentRate> rates = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "parent_id")
    private Parent parent;

    @ManyToMany
    @JoinTable(
            name = "course_student",
            joinColumns = @JoinColumn(name = "student_id"),
            inverseJoinColumns = @JoinColumn(name = "course_id")
    )
    @JsonIgnore
    private List<Course> courses = new ArrayList<>();

    @Column(name = "missed_lessons")
    private Integer missedLessons = 0;

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

    @Column(name = "self_paid")
    private Boolean selfPaid = false;

    @Column(name = "registration_completed")
    private Boolean registrationCompleted = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "reset_token")
    private String resetToken;

    @Column(name = "reset_token_expiry")
    private LocalDateTime resetTokenExpiry;

    @Column(name = "password_hash")
    @JsonIgnore
    private String passwordHash;

    @Column(name = "archived")
    private Boolean archived = false;

    // ✅ SEC-5: Лимит попыток входа
    @Column(name = "failed_login_attempts")
    private Integer failedLoginAttempts = 0;

    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

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
        this.failedLoginAttempts = 0;
    }

    // Геттеры
    public String getResetToken() { return resetToken; }
    public LocalDateTime getResetTokenExpiry() { return resetTokenExpiry; }
    public List<Course> getCourses() { return courses; }
    public Integer getMissedLessons() { return missedLessons; }
    public Long getId() { return id; }
    public List<Tutor> getTutors() { return tutors; }
    public List<StudentRate> getRates() { return rates; }
    public Parent getParent() { return parent; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public Boolean getSelfPaid() { return selfPaid; }
    public String getPhone() { return phone; }
    public String getParentName() { return parentName; }
    public String getParentPhone() { return parentPhone; }
    public LocalDate getBirthday() { return birthday; }
    public String getRole() { return role; }
    public Boolean getRegistrationCompleted() { return registrationCompleted; }
    public String getPaymentType() { return paymentType; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getPasswordHash() { return passwordHash; }
    public Boolean getArchived() { return archived; }
    public Integer getFailedLoginAttempts() { return failedLoginAttempts; }
    public LocalDateTime getLockedUntil() { return lockedUntil; }

    // Сеттеры
    public void setResetToken(String resetToken) { this.resetToken = resetToken; }
    public void setMissedLessons(Integer missedLessons) { this.missedLessons = missedLessons; }
    public void setId(Long id) { this.id = id; }
    public void setResetTokenExpiry(LocalDateTime resetTokenExpiry) { this.resetTokenExpiry = resetTokenExpiry; }
    public void setSelfPaid(Boolean selfPaid) { this.selfPaid = selfPaid; }
    public void setRegistrationCompleted(Boolean registrationCompleted) { this.registrationCompleted = registrationCompleted; }
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
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public void setCourses(List<Course> courses) { this.courses = courses; }
    public void setArchived(Boolean archived) { this.archived = archived; }
    public void setFailedLoginAttempts(Integer failedLoginAttempts) { this.failedLoginAttempts = failedLoginAttempts; }
    public void setLockedUntil(LocalDateTime lockedUntil) { this.lockedUntil = lockedUntil; }

    // ✅ Вспомогательные методы
    public boolean isLocked() {
        return lockedUntil != null && lockedUntil.isAfter(LocalDateTime.now());
    }

    public void incrementFailedAttempts() {
        this.failedLoginAttempts = (this.failedLoginAttempts == null ? 0 : this.failedLoginAttempts) + 1;
    }

    public void resetFailedAttempts() {
        this.failedLoginAttempts = 0;
        this.lockedUntil = null;
    }

    public void addTutor(Tutor tutor) {
        if (this.tutors == null) this.tutors = new ArrayList<>();
        if (!this.tutors.contains(tutor)) this.tutors.add(tutor);
    }

    public void removeTutor(Tutor tutor) {
        if (this.tutors != null) this.tutors.remove(tutor);
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
        if (this.rates == null) this.rates = new ArrayList<>();
        for (StudentRate sr : rates) {
            if (sr.getTutor() != null && sr.getTutor().getId().equals(tutor.getId())) {
                sr.setRatePerLesson(rate);
                return;
            }
        }
        rates.add(new StudentRate(this, tutor, rate));
    }

    public void setRateForTutor(Tutor tutor, BigDecimal rate, String paymentType) {
        if (this.rates == null) this.rates = new ArrayList<>();
        for (StudentRate sr : rates) {
            if (sr.getTutor() != null && sr.getTutor().getId().equals(tutor.getId())) {
                sr.setRatePerLesson(rate);
                sr.setPaymentType(paymentType);
                return;
            }
        }
        rates.add(new StudentRate(this, tutor, rate, paymentType));
    }

    public String getPaymentTypeForTutor(Long tutorId) {
        if (rates == null) return paymentType != null ? paymentType : "single";
        for (StudentRate rate : rates) {
            if (rate.getTutor() != null && rate.getTutor().getId().equals(tutorId)) {
                return rate.getPaymentType() != null ? rate.getPaymentType() : (paymentType != null ? paymentType : "single");
            }
        }
        return paymentType != null ? paymentType : "single";
    }

    @Transient
    public BigDecimal getRatePerLesson() {
        if (rates != null && !rates.isEmpty()) return rates.get(0).getRatePerLesson();
        return null;
    }
}