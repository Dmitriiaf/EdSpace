package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "tournament_participant",
        uniqueConstraints = @UniqueConstraint(columnNames = {"tournament_id", "student_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TournamentParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(nullable = false)
    private String status = "PENDING"; // PENDING | APPROVED | REJECTED

    @Column(name = "base_score")
    private Integer baseScore;

    @Column(name = "round1_score")
    private Integer round1Score;

    @Column(name = "round2_score")
    private Integer round2Score;

    @Column(name = "round3_score")
    private Integer round3Score;

    @Column(name = "round4_score")
    private Integer round4Score;

    @Column(name = "average_progress", precision = 10, scale = 4)
    private BigDecimal averageProgress;

    @Column(name = "place")
    private Integer place;

    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt = LocalDateTime.now();
}