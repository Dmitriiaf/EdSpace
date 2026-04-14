package com.example.demo.service;

import com.example.demo.entity.*;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class LessonPlanService {

    @Autowired
    private LessonPlanRepository lessonPlanRepository;

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private LessonService lessonService;

    public LessonPlan createLessonPlan(Long tutorId, Long courseId, String title,
                                       String description, String topic,
                                       String learningObjectives, String materialsNeeded,
                                       String lessonStructure, String homeworkTemplate,
                                       Integer durationMinutes, Integer difficultyLevel,
                                       String tags) {
        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new RuntimeException("Репетитор не найден"));

        Course course = courseId != null ? courseRepository.findById(courseId).orElse(null) : null;

        LessonPlan plan = new LessonPlan(tutor, title, topic);
        plan.setCourse(course);
        plan.setDescription(description);
        plan.setLearningObjectives(learningObjectives);
        plan.setMaterialsNeeded(materialsNeeded);
        plan.setLessonStructure(lessonStructure);
        plan.setHomeworkTemplate(homeworkTemplate);
        plan.setDurationMinutes(durationMinutes);
        plan.setDifficultyLevel(difficultyLevel);
        plan.setTags(tags);

        return lessonPlanRepository.save(plan);
    }

    public List<LessonPlan> getLessonPlansByTutor(Long tutorId) {
        return lessonPlanRepository.findByTutorId(tutorId);
    }

    public List<LessonPlan> getLessonPlansByCourse(Long tutorId, Long courseId) {
        return lessonPlanRepository.findByTutorIdAndCourseId(tutorId, courseId);
    }

    public List<LessonPlan> searchLessonPlans(Long tutorId, String query) {
        if (query == null || query.isEmpty()) {
            return lessonPlanRepository.findByTutorId(tutorId);
        }
        return lessonPlanRepository.search(tutorId, query);
    }

    public List<LessonPlan> getTemplates(Long tutorId) {
        return lessonPlanRepository.findTemplates(tutorId);
    }

    public LessonPlan getLessonPlanById(Long id) {
        return lessonPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("План урока не найден"));
    }

    @Transactional
    public LessonPlan updateLessonPlan(Long id, Long courseId, String title,
                                       String description, String topic,
                                       String learningObjectives, String materialsNeeded,
                                       String lessonStructure, String homeworkTemplate,
                                       Integer durationMinutes, Integer difficultyLevel,
                                       String tags) {
        LessonPlan plan = getLessonPlanById(id);

        if (courseId != null) {
            Course course = courseRepository.findById(courseId).orElse(null);
            plan.setCourse(course);
        }
        if (title != null) plan.setTitle(title);
        if (description != null) plan.setDescription(description);
        if (topic != null) plan.setTopic(topic);
        if (learningObjectives != null) plan.setLearningObjectives(learningObjectives);
        if (materialsNeeded != null) plan.setMaterialsNeeded(materialsNeeded);
        if (lessonStructure != null) plan.setLessonStructure(lessonStructure);
        if (homeworkTemplate != null) plan.setHomeworkTemplate(homeworkTemplate);
        if (durationMinutes != null) plan.setDurationMinutes(durationMinutes);
        if (difficultyLevel != null) plan.setDifficultyLevel(difficultyLevel);
        if (tags != null) plan.setTags(tags);

        plan.setUpdatedAt(LocalDateTime.now());

        return lessonPlanRepository.save(plan);
    }

    @Transactional
    public void deleteLessonPlan(Long id) {
        LessonPlan plan = getLessonPlanById(id);
        lessonPlanRepository.delete(plan);
    }

    @Transactional
    public void applyPlanToLesson(Long planId, Long lessonId) {
        LessonPlan plan = getLessonPlanById(planId);
        Lesson lesson = lessonService.getLessonById(lessonId);

        StringBuilder notes = new StringBuilder();
        if (lesson.getNotes() != null && !lesson.getNotes().isEmpty()) {
            notes.append(lesson.getNotes()).append("\n\n---\n\n");
        }

        notes.append("📋 ПЛАН УРОКА: ").append(plan.getTitle()).append("\n\n");
        notes.append("📚 Тема: ").append(plan.getTopic()).append("\n\n");

        if (plan.getLearningObjectives() != null && !plan.getLearningObjectives().isEmpty()) {
            notes.append("🎯 Цели урока:\n").append(plan.getLearningObjectives()).append("\n\n");
        }

        if (plan.getLessonStructure() != null && !plan.getLessonStructure().isEmpty()) {
            notes.append("📖 Структура урока:\n").append(plan.getLessonStructure()).append("\n\n");
        }

        if (plan.getMaterialsNeeded() != null && !plan.getMaterialsNeeded().isEmpty()) {
            notes.append("📚 Материалы:\n").append(plan.getMaterialsNeeded()).append("\n\n");
        }

        lesson.setNotes(notes.toString());

        if (plan.getHomeworkTemplate() != null && !plan.getHomeworkTemplate().isEmpty()) {
            String nextPlan = lesson.getNextLessonPlan();
            if (nextPlan != null && !nextPlan.isEmpty()) {
                lesson.setNextLessonPlan(plan.getHomeworkTemplate() + "\n\n---\n\n" + nextPlan);
            } else {
                lesson.setNextLessonPlan(plan.getHomeworkTemplate());
            }
        }

        lessonService.addNotes(lessonId, lesson.getNotes(), lesson.getNextLessonPlan());

        plan.incrementUsageCount();
        lessonPlanRepository.save(plan);
    }

    public Map<String, Object> getStats(Long tutorId) {
        List<LessonPlan> plans = lessonPlanRepository.findByTutorId(tutorId);

        long totalPlans = plans.size();
        long totalTemplates = plans.stream().filter(p -> Boolean.TRUE.equals(p.getIsTemplate())).count();
        long totalUsage = plans.stream().mapToInt(p -> p.getUsageCount() != null ? p.getUsageCount() : 0).sum();
        double avgDifficulty = plans.stream()
                .filter(p -> p.getDifficultyLevel() != null)
                .mapToInt(p -> p.getDifficultyLevel())
                .average()
                .orElse(0);

        List<String> topics = lessonPlanRepository.findDistinctTopics(tutorId);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalPlans", totalPlans);
        stats.put("totalTemplates", totalTemplates);
        stats.put("totalUsage", totalUsage);
        stats.put("averageDifficulty", Math.round(avgDifficulty * 10) / 10.0);
        stats.put("topics", topics);

        return stats;
    }
}