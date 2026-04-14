package com.example.demo.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class GradeWithScoreRequest {

    @NotNull(message = "Баллы обязательны")
    @Min(value = 0, message = "Минимальное количество баллов - 0")
    @Max(value = 100, message = "Максимальное количество баллов - 100")
    private Integer score;

    @NotNull(message = "Максимальный балл обязателен")
    @Min(value = 1, message = "Максимальный балл должен быть больше 0")
    private Integer maxScore;

    private String feedback;

    // Геттеры и сеттеры
    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }
    public Integer getMaxScore() { return maxScore; }
    public void setMaxScore(Integer maxScore) { this.maxScore = maxScore; }
    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }
}