package com.example.demo.repository;

import com.example.demo.entity.StudentAchievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentAchievementRepository extends JpaRepository<StudentAchievement, Long> {
    List<StudentAchievement> findByStudentId(Long studentId);
    Optional<StudentAchievement> findByStudentIdAndAchievementKey(Long studentId, String achievementKey);
}