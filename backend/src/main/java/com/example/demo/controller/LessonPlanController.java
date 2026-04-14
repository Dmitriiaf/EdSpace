package com.example.demo.controller;

import com.example.demo.entity.LessonPlan;
import com.example.demo.service.LessonPlanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lesson-plans")
@CrossOrigin(origins = "http://localhost:3000")
public class LessonPlanController {

    @Autowired
    private LessonPlanService lessonPlanService;

    @PostMapping
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> createLessonPlan(@RequestBody Map<String, Object> request,
                                              @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            LessonPlan plan = lessonPlanService.createLessonPlan(
                    currentUserId,
                    request.get("courseId") != null ? Long.parseLong(request.get("courseId").toString()) : null,
                    (String) request.get("title"),
                    (String) request.get("description"),
                    (String) request.get("topic"),
                    (String) request.get("learningObjectives"),
                    (String) request.get("materialsNeeded"),
                    (String) request.get("lessonStructure"),
                    (String) request.get("homeworkTemplate"),
                    request.get("durationMinutes") != null ? Integer.parseInt(request.get("durationMinutes").toString()) : null,
                    request.get("difficultyLevel") != null ? Integer.parseInt(request.get("difficultyLevel").toString()) : null,
                    (String) request.get("tags")
            );
            return ResponseEntity.ok(plan);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getLessonPlans(@RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            List<LessonPlan> plans = lessonPlanService.getLessonPlansByTutor(currentUserId);
            return ResponseEntity.ok(plans);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/course/{courseId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getLessonPlansByCourse(@PathVariable Long courseId,
                                                    @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            List<LessonPlan> plans = lessonPlanService.getLessonPlansByCourse(currentUserId, courseId);
            return ResponseEntity.ok(plans);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/templates")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getTemplates(@RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            List<LessonPlan> templates = lessonPlanService.getTemplates(currentUserId);
            return ResponseEntity.ok(templates);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> search(@RequestParam(required = false) String q,
                                    @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            List<LessonPlan> results = lessonPlanService.searchLessonPlans(currentUserId, q);
            return ResponseEntity.ok(results);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getLessonPlanById(@PathVariable Long id,
                                               @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            LessonPlan plan = lessonPlanService.getLessonPlanById(id);

            // ✅ IDOR FIX: Проверяем, что план принадлежит текущему репетитору
            if (!plan.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            return ResponseEntity.ok(plan);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> updateLessonPlan(@PathVariable Long id,
                                              @RequestBody Map<String, Object> request,
                                              @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            LessonPlan plan = lessonPlanService.getLessonPlanById(id);

            // ✅ IDOR FIX: Проверяем, что план принадлежит текущему репетитору
            if (!plan.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            LessonPlan updatedPlan = lessonPlanService.updateLessonPlan(
                    id,
                    request.get("courseId") != null ? Long.parseLong(request.get("courseId").toString()) : null,
                    (String) request.get("title"),
                    (String) request.get("description"),
                    (String) request.get("topic"),
                    (String) request.get("learningObjectives"),
                    (String) request.get("materialsNeeded"),
                    (String) request.get("lessonStructure"),
                    (String) request.get("homeworkTemplate"),
                    request.get("durationMinutes") != null ? Integer.parseInt(request.get("durationMinutes").toString()) : null,
                    request.get("difficultyLevel") != null ? Integer.parseInt(request.get("difficultyLevel").toString()) : null,
                    (String) request.get("tags")
            );
            return ResponseEntity.ok(updatedPlan);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{planId}/apply-to-lesson/{lessonId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> applyPlanToLesson(@PathVariable Long planId,
                                               @PathVariable Long lessonId,
                                               @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            LessonPlan plan = lessonPlanService.getLessonPlanById(planId);

            // ✅ IDOR FIX: Проверяем, что план принадлежит текущему репетитору
            if (!plan.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            lessonPlanService.applyPlanToLesson(planId, lessonId);
            return ResponseEntity.ok(Map.of("message", "План урока применён к занятию"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> deleteLessonPlan(@PathVariable Long id,
                                              @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            LessonPlan plan = lessonPlanService.getLessonPlanById(id);

            // ✅ IDOR FIX: Проверяем, что план принадлежит текущему репетитору
            if (!plan.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            lessonPlanService.deleteLessonPlan(id);
            return ResponseEntity.ok(Map.of("message", "План урока удалён"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getStats(@RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Map<String, Object> stats = lessonPlanService.getStats(currentUserId);
            return ResponseEntity.ok(stats);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}