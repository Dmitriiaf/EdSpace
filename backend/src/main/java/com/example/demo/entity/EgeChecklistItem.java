package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "ege_checklist_item",
        uniqueConstraints = @UniqueConstraint(columnNames = {"checklist_id", "task_number"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EgeChecklistItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checklist_id", nullable = false)
    private EgeChecklist checklist;

    @Column(name = "task_number", nullable = false)
    private Integer taskNumber;

    @Column(nullable = false)
    private Boolean knows = false;

    @Column(nullable = false)
    private String difficulty;

    @Column(name = "solution_type", nullable = false)
    private String solutionType;

    @Column(name = "primary_score", nullable = false)
    private Integer primaryScore = 1;

    private String topic;

    private String note;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}