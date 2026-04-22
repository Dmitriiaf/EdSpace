package com.example.demo.dto;

public class SubscriptionDTO {
    private Long id;
    private Integer totalLessons;
    private Integer remainingLessons;
    private Integer debtLessons;
    private String status;

    public SubscriptionDTO() {}

    // Геттеры и сеттеры
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Integer getTotalLessons() { return totalLessons; }
    public void setTotalLessons(Integer totalLessons) { this.totalLessons = totalLessons; }

    public Integer getRemainingLessons() { return remainingLessons; }
    public void setRemainingLessons(Integer remainingLessons) { this.remainingLessons = remainingLessons; }

    public Integer getDebtLessons() { return debtLessons; }
    public void setDebtLessons(Integer debtLessons) { this.debtLessons = debtLessons; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}