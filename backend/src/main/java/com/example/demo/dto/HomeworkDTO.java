package com.example.demo.dto;

import java.time.LocalDateTime;

public class HomeworkDTO {
    private Long id;
    private Long tutorId;
    private String tutorName;
    private Long studentId;
    private String studentName;
    private String task;
    private LocalDateTime dueDate;
    private LocalDateTime submittedAt;
    private String feedback;
    private Integer grade;
    private Integer score;
    private Integer maxScore;
    private Double percentage;
    private String status;
    private String attachments;

    public HomeworkDTO() {}

    // Геттеры
    public Long getId() { return id; }
    public Long getTutorId() { return tutorId; }
    public String getTutorName() { return tutorName; }
    public Long getStudentId() { return studentId; }
    public String getStudentName() { return studentName; }
    public String getTask() { return task; }
    public LocalDateTime getDueDate() { return dueDate; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public String getFeedback() { return feedback; }
    public Integer getGrade() { return grade; }
    public Integer getScore() { return score; }
    public Integer getMaxScore() { return maxScore; }
    public Double getPercentage() { return percentage; }
    public String getStatus() { return status; }
    public String getAttachments() { return attachments; }

    // Сеттеры
    public void setId(Long id) { this.id = id; }
    public void setTutorId(Long tutorId) { this.tutorId = tutorId; }
    public void setTutorName(String tutorName) { this.tutorName = tutorName; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }
    public void setStudentName(String studentName) { this.studentName = studentName; }
    public void setTask(String task) { this.task = task; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
    public void setFeedback(String feedback) { this.feedback = feedback; }
    public void setGrade(Integer grade) { this.grade = grade; }
    public void setScore(Integer score) { this.score = score; }
    public void setMaxScore(Integer maxScore) { this.maxScore = maxScore; }
    public void setPercentage(Double percentage) { this.percentage = percentage; }
    public void setStatus(String status) { this.status = status; }
    public void setAttachments(String attachments) { this.attachments = attachments; }
}