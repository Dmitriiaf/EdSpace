package com.example.demo.service;

import com.example.demo.entity.Homework;
import com.example.demo.entity.StudentAchievement;
import com.example.demo.repository.HomeworkRepository;
import com.example.demo.repository.StudentAchievementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AchievementService {

    private final StudentAchievementRepository achievementRepository;
    private final PointsService pointsService;
    private final HomeworkRepository homeworkRepository;

    @Transactional
    public void unlock(Long studentId, String achievementKey) {
        if (achievementRepository.findByStudentIdAndAchievementKey(studentId, achievementKey).isPresent()) {
            return; // Уже есть
        }

        StudentAchievement achievement = new StudentAchievement();
        achievement.setStudentId(studentId);
        achievement.setAchievementKey(achievementKey);
        achievementRepository.save(achievement);

        // Начисляем 15 баллов за ачивку
        pointsService.award(studentId, 15, "ACHIEVEMENT_" + achievementKey, null);
        log.info("🏅 Ученик {} получил ачивку {}", studentId, achievementKey);
    }

    public List<StudentAchievement> getStudentAchievements(Long studentId) {
        return achievementRepository.findByStudentId(studentId);
    }

    @Transactional
    public void checkMockExamAchievements(Long studentId, Integer score) {
        if (score == null) return;

        unlock(studentId, "FIRST_MOCK");
        if (score >= 80) unlock(studentId, "MOCK_80");
        if (score >= 100) unlock(studentId, "MOCK_100");

        // Ракета (улучшение на 20+)
        List<Homework> mocks = homeworkRepository.findByStudentIdAndTypeOrderByCreatedAtDesc(studentId, "MOCK_EXAM");
        if (mocks.size() >= 2) {
            int current = mocks.get(0).getScore() != null ? mocks.get(0).getScore() : 0;
            int prev = mocks.get(1).getScore() != null ? mocks.get(1).getScore() : 0;
            if (current - prev >= 20) unlock(studentId, "MOCK_UP_20");
        }
    }
}