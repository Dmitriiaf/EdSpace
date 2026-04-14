// ========== backend/src/main/java/com/example/demo/entity/TaskBank.java (ИСПРАВЛЕННАЯ ВЕРСИЯ) ==========
package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "task_bank")
public class TaskBank {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_number")
    private Integer taskNumber;

    @Column(name = "external_id")
    private String externalId;          // ID задания в источнике

    @Column(nullable = false)
    private String source;              // KEGE, RESHUEGE, MANUAL, AI_GENERATED

    @Column(nullable = false, length = 5000)
    private String question;            // Текст задания

    @Column(length = 5000)
    private String answer;              // Ответ (для тестов)

    @Column(length = 2000)
    private String explanation;         // Объяснение/решение

    @Column(nullable = false)
    private String subject;             // Математика, Русский язык, Информатика и т.д.

    @Column(nullable = false)
    private String type;                // test, essay, problem, speaking

    @Column(name = "difficulty")
    private Integer difficulty;         // 1-10

    @Column(name = "max_score")
    private Integer maxScore;           // Максимальный балл

    @Column(name = "exam_type")
    private String examType;            // ЕГЭ, ОГЭ

    @Column(name = "grade_level")
    private Integer gradeLevel;         // 9, 10, 11 класс

    @Column(name = "topic")
    private String topic;               // Тема (алгебра, геометрия, грамматика...)

    @Column(name = "subtopic")
    private String subtopic;            // Подтема

    @Column(name = "tags", length = 500)
    private String tags;                // Теги через запятую

    @Column(name = "is_public")
    private Boolean isPublic = true;    // Общедоступное задание

    @ManyToOne
    @JoinColumn(name = "tutor_id")
    private Tutor tutor;                // Репетитор, который добавил задание

    // ✅ НОВЫЕ ПОЛЯ ДЛЯ РЕЙТИНГА
    @Column(name = "rating")
    private Double rating;              // Средняя оценка (1-5)

    @Column(name = "rating_count")
    private Integer ratingCount = 0;    // Количество оценок

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public TaskBank() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public TaskBank(String source, String question, String subject, String type, String examType) {
        this();
        this.source = source;
        this.question = question;
        this.subject = subject;
        this.type = type;
        this.examType = examType;
    }

    // Геттеры
    public Long getId() { return id; }
    public String getExternalId() { return externalId; }
    public Integer getTaskNumber() { return taskNumber; }
    public String getSource() { return source; }
    public String getQuestion() { return question; }
    public String getAnswer() { return answer; }
    public String getExplanation() { return explanation; }
    public String getSubject() { return subject; }
    public String getType() { return type; }
    public Integer getDifficulty() { return difficulty; }
    public Integer getMaxScore() { return maxScore; }
    public String getExamType() { return examType; }
    public Integer getGradeLevel() { return gradeLevel; }
    public String getTopic() { return topic; }
    public String getSubtopic() { return subtopic; }
    public String getTags() { return tags; }
    public Boolean getIsPublic() { return isPublic; }
    public Tutor getTutor() { return tutor; }
    public Double getRating() { return rating; }           // ✅ Геттер
    public Integer getRatingCount() { return ratingCount; } // ✅ Геттер
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // Сеттеры
    public void setId(Long id) { this.id = id; }
    public void setTaskNumber(Integer taskNumber) { this.taskNumber = taskNumber; }
    public void setExternalId(String externalId) { this.externalId = externalId; }
    public void setSource(String source) { this.source = source; }
    public void setQuestion(String question) { this.question = question; }
    public void setAnswer(String answer) { this.answer = answer; }
    public void setExplanation(String explanation) { this.explanation = explanation; }
    public void setSubject(String subject) { this.subject = subject; }
    public void setType(String type) { this.type = type; }
    public void setDifficulty(Integer difficulty) { this.difficulty = difficulty; }
    public void setMaxScore(Integer maxScore) { this.maxScore = maxScore; }
    public void setExamType(String examType) { this.examType = examType; }
    public void setGradeLevel(Integer gradeLevel) { this.gradeLevel = gradeLevel; }
    public void setTopic(String topic) { this.topic = topic; }
    public void setSubtopic(String subtopic) { this.subtopic = subtopic; }
    public void setTags(String tags) { this.tags = tags; }
    public void setIsPublic(Boolean isPublic) { this.isPublic = isPublic; }
    public void setTutor(Tutor tutor) { this.tutor = tutor; }
    public void setRating(Double rating) { this.rating = rating; }           // ✅ Сеттер
    public void setRatingCount(Integer ratingCount) { this.ratingCount = ratingCount; } // ✅ Сеттер
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}