package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "game_score")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class GameScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "tutor_id")
    private Long tutorId;

    @Column(nullable = false, length = 50)
    private String game = "flappy";

    @Column(name = "high_score", nullable = false)
    private Integer highScore = 0;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public GameScore() {}

    public GameScore(Long studentId, Long tutorId, String game, Integer highScore) {
        this.studentId = studentId;
        this.tutorId = tutorId;
        this.game = game;
        this.highScore = highScore;
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }
    public Long getTutorId() { return tutorId; }
    public void setTutorId(Long tutorId) { this.tutorId = tutorId; }
    public String getGame() { return game; }
    public void setGame(String game) { this.game = game; }
    public Integer getHighScore() { return highScore; }
    public void setHighScore(Integer highScore) { this.highScore = highScore; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}