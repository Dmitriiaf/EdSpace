package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "lesson")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "originalLesson"})
public class Lesson {

    public static final String STATUS_SCHEDULED = "SCHEDULED";
    public static final String STATUS_IN_PROGRESS = "IN_PROGRESS";
    public static final String STATUS_COMPLETED = "COMPLETED";
    public static final String STATUS_PAID = "PAID";
    public static final String STATUS_CANCELLED = "CANCELLED";
    public static final String STATUS_RESCHEDULED = "RESCHEDULED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tutor_id", nullable = false)
    private Tutor tutor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @Column(name = "lesson_date", nullable = false)
    private LocalDate lessonDate;

    @Column(name = "weekly_template_id")
    private Long weeklyTemplateId;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(nullable = false)
    private String status = STATUS_SCHEDULED;

    @ManyToOne
    @JoinColumn(name = "original_lesson_id")
    private Lesson originalLesson;

    @Column(length = 2000)
    private String notes;

    @Column(name = "duration")
    private Integer duration = 60;

    @Column(name = "next_lesson_plan", length = 2000)
    private String nextLessonPlan;

    @Column(name = "board_room_name")
    private String boardRoomName;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "jitsi_room_name")
    private String jitsiRoomName;

    @Column(name = "auto_completed")
    private Boolean autoCompleted = false;

    @Column(name = "call_started_at")
    private LocalDateTime callStartedAt;

    public Lesson() {}

    public Lesson(Tutor tutor, Student student, Course course,
                  LocalDate lessonDate, LocalTime startTime, LocalTime endTime) {
        this.tutor = tutor;
        this.student = student;
        this.course = course;
        this.lessonDate = lessonDate;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    // Геттеры
    public Integer getDuration() { return duration; }
    public Long getWeeklyTemplateId() { return weeklyTemplateId; }
    public Long getId() { return id; }
    public Tutor getTutor() { return tutor; }
    public Student getStudent() { return student; }
    public Course getCourse() { return course; }
    public LocalDate getLessonDate() { return lessonDate; }
    public LocalTime getStartTime() { return startTime; }
    public LocalTime getEndTime() { return endTime; }
    public String getStatus() { return status; }
    public Lesson getOriginalLesson() { return originalLesson; }
    public String getNotes() { return notes; }
    public String getJitsiRoomName() { return jitsiRoomName; }
    public String getBoardRoomName() { return boardRoomName; }
    public String getNextLessonPlan() { return nextLessonPlan; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public LocalDateTime getPaidAt() { return paidAt; }
    public Boolean getAutoCompleted() { return autoCompleted; }
    public LocalDateTime getCallStartedAt() { return callStartedAt; }

    // Сеттеры
    public void setDuration(Integer duration) { this.duration = duration; }
    public void setWeeklyTemplateId(Long weeklyTemplateId) { this.weeklyTemplateId = weeklyTemplateId; }
    public void setTutor(Tutor tutor) { this.tutor = tutor; }
    public void setStudent(Student student) { this.student = student; }
    public void setCourse(Course course) { this.course = course; }
    public void setJitsiRoomName(String jitsiRoomName) { this.jitsiRoomName = jitsiRoomName; }
    public void setBoardRoomName(String boardRoomName) { this.boardRoomName = boardRoomName; }
    public void setLessonDate(LocalDate lessonDate) { this.lessonDate = lessonDate; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
    public void setStatus(String status) { this.status = status; this.updatedAt = LocalDateTime.now(); }
    public void setOriginalLesson(Lesson originalLesson) { this.originalLesson = originalLesson; }
    public void setNotes(String notes) { this.notes = notes; this.updatedAt = LocalDateTime.now(); }
    public void setNextLessonPlan(String nextLessonPlan) { this.nextLessonPlan = nextLessonPlan; this.updatedAt = LocalDateTime.now(); }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }
    public void setAutoCompleted(Boolean autoCompleted) { this.autoCompleted = autoCompleted; }
    public void setCallStartedAt(LocalDateTime callStartedAt) { this.callStartedAt = callStartedAt; }

    public boolean isRescheduled() { return originalLesson != null; }
    public boolean isCompleted() { return STATUS_COMPLETED.equals(status); }
    public boolean isPaid() { return STATUS_PAID.equals(status); }
    public boolean isScheduled() { return STATUS_SCHEDULED.equals(status); }
    public boolean isInProgress() { return STATUS_IN_PROGRESS.equals(status); }
}