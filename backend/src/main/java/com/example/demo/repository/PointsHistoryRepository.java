package com.example.demo.repository;

import com.example.demo.entity.PointsHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PointsHistoryRepository extends JpaRepository<PointsHistory, Long> {
    List<PointsHistory> findByStudentIdOrderByCreatedAtDesc(Long studentId);

    boolean existsByStudentIdAndReasonAndRelatedId(Long studentId, String reason, Long relatedId);
}