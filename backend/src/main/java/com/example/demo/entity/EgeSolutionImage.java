package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "ege_solution_image")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EgeSolutionImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "solution_id", nullable = false)
    @JsonIgnore
    private EgeSolution solution;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Column(name = "order_index")
    private Integer orderIndex = 0;

    @Column(name = "image_type", length = 20)
    private String imageType = "SOLUTION";

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}