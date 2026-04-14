package com.example.demo.repository;

import com.example.demo.entity.LessonPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonPlanRepository extends JpaRepository<LessonPlan, Long> {

    List<LessonPlan> findByTutorId(Long tutorId);

    List<LessonPlan> findByTutorIdAndCourseId(Long tutorId, Long courseId);

    @Query("SELECT l FROM LessonPlan l WHERE l.tutor.id = :tutorId AND " +
            "(LOWER(l.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(l.topic) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(l.tags) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<LessonPlan> search(@Param("tutorId") Long tutorId, @Param("search") String search);

    @Query("SELECT l FROM LessonPlan l WHERE l.tutor.id = :tutorId AND l.isTemplate = true")
    List<LessonPlan> findTemplates(@Param("tutorId") Long tutorId);

    @Query("SELECT DISTINCT l.topic FROM LessonPlan l WHERE l.tutor.id = :tutorId")
    List<String> findDistinctTopics(@Param("tutorId") Long tutorId);
}