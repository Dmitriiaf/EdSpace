package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDateTime;

public class CreateHomeworkRequest {

    @NotNull(message = "ID репетитора обязателен")
    private Long tutorId;

    @NotNull(message = "ID ученика обязателен")
    private Long studentId;

    @NotBlank(message = "Задание не может быть пустым")
    private String task;

    private LocalDateTime dueDate;

    private String status;

    // Геттеры и сеттеры
    public Long getTutorId() { return tutorId; }
    public void setTutorId(Long tutorId) { this.tutorId = tutorId; }
    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }
    public String getTask() { return task; }
    public void setTask(String task) { this.task = task; }
    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}