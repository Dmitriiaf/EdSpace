// ========== backend/src/main/java/com/example/demo/entity/BoardSession.java (МНОГО УЧЕНИКОВ) ==========
package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Entity
@Table(name = "board_session")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BoardSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String roomName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tutor_id", nullable = false)
    private Tutor tutor;

    // Старая связь — оставляем для обратной совместимости
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private Student student;

    // Новая связь многие-ко-многим
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "board_student",
            joinColumns = @JoinColumn(name = "board_id"),
            inverseJoinColumns = @JoinColumn(name = "student_id")
    )
    @Builder.Default
    private List<Student> students = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id")
    private Lesson lesson;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String url;

    @Column(nullable = false)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, ARCHIVED

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    private LocalDateTime archivedAt;

    @Column(columnDefinition = "TEXT")
    private String canvasImage;

    // ========== Вспомогательные методы ==========

    // Получить имена учеников через запятую
    public String getStudentNames() {
        if (students != null && !students.isEmpty()) {
            return students.stream()
                    .map(Student::getFullName)
                    .collect(Collectors.joining(", "));
        }
        if (student != null) {
            return student.getFullName();
        }
        return "";
    }

    // Получить список ID учеников
    public List<Long> getStudentIds() {
        if (students != null && !students.isEmpty()) {
            return students.stream().map(Student::getId).collect(Collectors.toList());
        }
        if (student != null) {
            return List.of(student.getId());
        }
        return List.of();
    }

    // ========== Геттеры/сеттеры (Lombok не всегда дружит с JPA) ==========
    public String getCanvasImage() { return canvasImage; }
    public void setCanvasImage(String canvasImage) { this.canvasImage = canvasImage; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getRoomName() { return roomName; }
    public void setRoomName(String roomName) { this.roomName = roomName; }
    public Tutor getTutor() { return tutor; }
    public void setTutor(Tutor tutor) { this.tutor = tutor; }
    public Student getStudent() { return student; }
    public void setStudent(Student student) { this.student = student; }
    public List<Student> getStudents() { return students; }
    public void setStudents(List<Student> students) { this.students = students; }
    public Lesson getLesson() { return lesson; }
    public void setLesson(Lesson lesson) { this.lesson = lesson; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getArchivedAt() { return archivedAt; }
    public void setArchivedAt(LocalDateTime archivedAt) { this.archivedAt = archivedAt; }
}