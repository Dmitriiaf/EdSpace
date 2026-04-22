package com.example.demo.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

public class LessonDTO {
    private Long id;
    private Long tutorId;
    private String tutorName;
    private Integer duration;
    private Long studentId;
    private String studentName;
    private Long courseId;
    private String courseName;
    private String courseColor;
    private LocalDate lessonDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String status;
    private String notes;
    private String nextLessonPlan;
    private LocalDateTime completedAt;
    private LocalDateTime paidAt;

    public LessonDTO() {}

    // Геттеры
    public Integer getDuration() { return duration; }
    public Long getId() { return id; }
    public Long getTutorId() { return tutorId; }
    public String getTutorName() { return tutorName; }
    public Long getStudentId() { return studentId; }
    public String getStudentName() { return studentName; }
    public Long getCourseId() { return courseId; }
    public String getCourseName() { return courseName; }
    public String getCourseColor() { return courseColor; }
    public LocalDate getLessonDate() { return lessonDate; }
    public LocalTime getStartTime() { return startTime; }
    public LocalTime getEndTime() { return endTime; }
    public String getStatus() { return status; }
    public String getNotes() { return notes; }
    public String getNextLessonPlan() { return nextLessonPlan; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public LocalDateTime getPaidAt() { return paidAt; }

    // Сеттеры
    public void setDuration(Integer duration) { this.duration = duration; }
    public void setId(Long id) { this.id = id; }
    public void setTutorId(Long tutorId) { this.tutorId = tutorId; }
    public void setTutorName(String tutorName) { this.tutorName = tutorName; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }
    public void setStudentName(String studentName) { this.studentName = studentName; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }
    public void setCourseName(String courseName) { this.courseName = courseName; }
    public void setCourseColor(String courseColor) { this.courseColor = courseColor; }
    public void setLessonDate(LocalDate lessonDate) { this.lessonDate = lessonDate; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
    public void setStatus(String status) { this.status = status; }
    public void setNotes(String notes) { this.notes = notes; }
    public void setNextLessonPlan(String nextLessonPlan) { this.nextLessonPlan = nextLessonPlan; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }
}