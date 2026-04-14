package com.example.demo.repository;

import com.example.demo.entity.ProgressRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Repository
public interface ProgressRecordRepository extends JpaRepository<ProgressRecord, Long> {

    List<ProgressRecord> findByStudentIdOrderByRecordDateAsc(Long studentId);

    List<ProgressRecord> findByStudentIdAndCourseIdOrderByRecordDateAsc(Long studentId, Long courseId);

    @Query("SELECT p FROM ProgressRecord p WHERE p.student.id = :studentId " +
            "AND p.recordDate BETWEEN :startDate AND :endDate ORDER BY p.recordDate ASC")
    List<ProgressRecord> findByStudentIdAndDateRange(@Param("studentId") Long studentId,
                                                     @Param("startDate") LocalDateTime startDate,
                                                     @Param("endDate") LocalDateTime endDate);

    @Query("SELECT AVG(p.score) FROM ProgressRecord p WHERE p.student.id = :studentId")
    Double getAverageScoreByStudent(@Param("studentId") Long studentId);

    @Query("SELECT p.course.name, AVG(p.score) FROM ProgressRecord p " +
            "WHERE p.student.id = :studentId AND p.course IS NOT NULL " +
            "GROUP BY p.course.name")
    List<Object[]> getAverageScoreByCourse(@Param("studentId") Long studentId);
}