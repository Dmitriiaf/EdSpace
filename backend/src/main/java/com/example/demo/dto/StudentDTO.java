package com.example.demo.dto;

public class StudentDTO {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String paymentType;
    private Integer rate;
    private String parentEmail;
    private String parentName;
    private Integer missedLessons;

    // Данные абонемента (если есть)
    private SubscriptionDTO subscription;

    public StudentDTO() {}

    // Геттеры и сеттеры
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getPaymentType() { return paymentType; }
    public void setPaymentType(String paymentType) { this.paymentType = paymentType; }

    public Integer getRate() { return rate; }
    public void setRate(Integer rate) { this.rate = rate; }

    public String getParentEmail() { return parentEmail; }
    public void setParentEmail(String parentEmail) { this.parentEmail = parentEmail; }

    public String getParentName() { return parentName; }
    public void setParentName(String parentName) { this.parentName = parentName; }

    public Integer getMissedLessons() { return missedLessons; }
    public void setMissedLessons(Integer missedLessons) { this.missedLessons = missedLessons; }

    public SubscriptionDTO getSubscription() { return subscription; }
    public void setSubscription(SubscriptionDTO subscription) { this.subscription = subscription; }
}