// ========== backend/src/main/java/com/example/demo/entity/Tutor.java (ИСПРАВЛЕННАЯ ВЕРСИЯ) ==========
package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "tutor")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "lessons", "templates", "subscriptions", "payments"})
public class Tutor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "timezone")
    private String timezone = "Asia/Krasnoyarsk";

    @Column(name = "avatar")
    private String avatar;

    private String phone;

    @Column(name = "birthday")
    private LocalDate birthday;

    @Column(name = "about", length = 1000)
    private String about;

    @Column(name = "city")
    private String city;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(nullable = false)
    private String role = "ROLE_TUTOR";

    @Column(name = "reset_token")
    private String resetToken;

    @Column(name = "reset_token_expiry")
    private LocalDateTime resetTokenExpiry;

    @Column(name = "video_room_name", unique = true)
    private String videoRoomName = "edspace-tutor-" + UUID.randomUUID().toString().substring(0, 8);

    // ✅ SEC-5: Лимит попыток входа
    @Column(name = "failed_login_attempts")
    private Integer failedLoginAttempts = 0;

    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    // ✅ REF-1: Реферальная система
    @Column(name = "referral_code", unique = true)
    private String referralCode = UUID.randomUUID().toString().substring(0, 8);

    @Column(name = "referred_by")
    private Long referredBy;

    @OneToMany(mappedBy = "tutor")
    private List<Course> courses = new ArrayList<>();

    public Tutor() {}

    public Tutor(String email, String passwordHash, String fullName, String phone) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.fullName = fullName;
        this.phone = phone;
        this.createdAt = LocalDateTime.now();
        this.isActive = true;
        this.role = "ROLE_TUTOR";
        this.videoRoomName = "edspace-tutor-" + UUID.randomUUID().toString().substring(0, 8);
        this.failedLoginAttempts = 0;
    }

    // Геттеры
    public String getTimezone() { return timezone; }
    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public String getFullName() { return fullName; }
    public String getPhone() { return phone; }
    public LocalDate getBirthday() { return birthday; }
    public String getAbout() { return about; }
    public String getCity() { return city; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public Boolean getIsActive() { return isActive; }
    public List<Course> getCourses() { return courses; }
    public String getAvatar() { return avatar; }
    public String getRole() { return role; }
    public String getResetToken() { return resetToken; }
    public LocalDateTime getResetTokenExpiry() { return resetTokenExpiry; }
    public String getVideoRoomName() { return videoRoomName; }
    public Integer getFailedLoginAttempts() { return failedLoginAttempts; }
    public LocalDateTime getLockedUntil() { return lockedUntil; }

    // Сеттеры
    public void setTimezone(String timezone) { this.timezone = timezone; }
    public void setEmail(String email) { this.email = email; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setBirthday(LocalDate birthday) { this.birthday = birthday; }
    public void setAbout(String about) { this.about = about; }
    public void setCity(String city) { this.city = city; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public void setCourses(List<Course> courses) { this.courses = courses; }
    public void setAvatar(String avatar) { this.avatar = avatar; }
    public void setRole(String role) { this.role = role; }
    public void setResetToken(String resetToken) { this.resetToken = resetToken; }
    public void setResetTokenExpiry(LocalDateTime resetTokenExpiry) { this.resetTokenExpiry = resetTokenExpiry; }
    public void setVideoRoomName(String videoRoomName) { this.videoRoomName = videoRoomName; }
    public void setFailedLoginAttempts(Integer failedLoginAttempts) { this.failedLoginAttempts = failedLoginAttempts; }
    public void setLockedUntil(LocalDateTime lockedUntil) { this.lockedUntil = lockedUntil; }

    public String getReferralCode() { return referralCode; }
    public void setReferralCode(String referralCode) { this.referralCode = referralCode; }
    public Long getReferredBy() { return referredBy; }
    public void setReferredBy(Long referredBy) { this.referredBy = referredBy; }

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
}