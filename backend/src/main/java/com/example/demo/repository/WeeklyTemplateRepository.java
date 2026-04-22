package com.example.demo.repository;

import com.example.demo.entity.WeeklyTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface WeeklyTemplateRepository extends JpaRepository<WeeklyTemplate, Long> {

    List<WeeklyTemplate> findByTutorId(Long tutorId);

    List<WeeklyTemplate> findByTutorIdAndDayOfWeek(Long tutorId, Integer dayOfWeek);

    List<WeeklyTemplate> findByStudentId(Long studentId);

    boolean existsByTutorIdAndDayOfWeekAndStartTime(Long tutorId, Integer dayOfWeek, LocalTime startTime);
}