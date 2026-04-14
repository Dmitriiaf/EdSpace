package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "lesson_plan")
public class LessonPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "tutor_id", nullable = false)
    private Tutor tutor;

    @ManyToOne
    @JoinColumn(name = "course_id")
    private Course course;

    @Column(nullable = false)
    private String title;

    @Column(length = 500)
    private String description;

    @Column(name = "topic", length = 500)
    private String topic;

    @Column(name = "learning_objectives", length = 2000)
    private String learningObjectives;  // Цели урока (JSON или текст с разделителями)

    @Column(name = "materials_needed", length = 1000)
    private String materialsNeeded;      // Необходимые материалы

    @Column(name = "lesson_structure", length = 5000)
    private String lessonStructure;      // Структура урока (оргмомент, основная часть, закрепление)

    @Column(name = "homework_template", length = 2000)
    private String homeworkTemplate;     // Шаблон домашнего задания

    @Column(name = "duration_minutes")
    private Integer durationMinutes;     // Длительность урока в минутах

    @Column(name = "difficulty_level")
    private Integer difficultyLevel;     // 1-5

    @Column(length = 500)
    private String tags;                 // Теги через запятую

    @Column(name = "is_template")
    private Boolean isTemplate = true;   // Является ли шаблоном

    @Column(name = "usage_count")
    private Integer usageCount = 0;      // Сколько раз использован

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public LessonPlan() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public LessonPlan(Tutor tutor, String title, String topic) {
        this();
        this.tutor = tutor;
        this.title = title;
        this.topic = topic;
    }

    // Геттеры
    public Long getId() { return id; }
    public Tutor getTutor() { return tutor; }
    public Course getCourse() { return course; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getTopic() { return topic; }
    public String getLearningObjectives() { return learningObjectives; }
    public String getMaterialsNeeded() { return materialsNeeded; }
    public String getLessonStructure() { return lessonStructure; }
    public String getHomeworkTemplate() { return homeworkTemplate; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public Integer getDifficultyLevel() { return difficultyLevel; }
    public String getTags() { return tags; }
    public Boolean getIsTemplate() { return isTemplate; }
    public Integer getUsageCount() { return usageCount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // Сеттеры
    public void setTutor(Tutor tutor) { this.tutor = tutor; }
    public void setCourse(Course course) { this.course = course; }
    public void setTitle(String title) { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setTopic(String topic) { this.topic = topic; }
    public void setLearningObjectives(String learningObjectives) { this.learningObjectives = learningObjectives; }
    public void setMaterialsNeeded(String materialsNeeded) { this.materialsNeeded = materialsNeeded; }
    public void setLessonStructure(String lessonStructure) { this.lessonStructure = lessonStructure; }
    public void setHomeworkTemplate(String homeworkTemplate) { this.homeworkTemplate = homeworkTemplate; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
    public void setDifficultyLevel(Integer difficultyLevel) { this.difficultyLevel = difficultyLevel; }
    public void setTags(String tags) { this.tags = tags; }
    public void setIsTemplate(Boolean isTemplate) { this.isTemplate = isTemplate; }
    public void setUsageCount(Integer usageCount) { this.usageCount = usageCount; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public void incrementUsageCount() {
        this.usageCount = (this.usageCount == null ? 0 : this.usageCount) + 1;
        this.updatedAt = LocalDateTime.now();
    }
}