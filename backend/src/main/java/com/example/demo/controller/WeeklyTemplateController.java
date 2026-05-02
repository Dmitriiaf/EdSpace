package com.example.demo.controller;

import com.example.demo.entity.WeeklyTemplate;
import com.example.demo.service.WeeklyTemplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import com.example.demo.repository.LessonRepository;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/weekly-template")
@CrossOrigin(origins = "http://localhost:3000")
public class WeeklyTemplateController {

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private WeeklyTemplateService templateService;

    @GetMapping("/tutor/{tutorId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getTemplates(@PathVariable Long tutorId,
                                          @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            if (!tutorId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            List<WeeklyTemplate> templates = templateService.getTemplatesByTutor(tutorId);
            return ResponseEntity.ok(templates);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> createTemplate(@RequestBody Map<String, Object> request,
                                            @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Long tutorId = Long.parseLong(request.get("tutorId").toString());

            if (!tutorId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            // ✅ Обработка 24:00 → 00:00
            String startTimeStr = request.get("startTime").toString();
            String endTimeStr = request.get("endTime").toString();

            if ("24:00:00".equals(startTimeStr) || "24:00".equals(startTimeStr)) startTimeStr = "00:00:00";
            if ("24:00:00".equals(endTimeStr) || "24:00".equals(endTimeStr)) endTimeStr = "00:00:00";

            WeeklyTemplate template = templateService.createTemplate(
                    tutorId,
                    Long.parseLong(request.get("studentId").toString()),
                    request.get("courseId") != null ? Long.parseLong(request.get("courseId").toString()) : null,
                    Integer.parseInt(request.get("dayOfWeek").toString()),
                    LocalTime.parse(startTimeStr),
                    LocalTime.parse(endTimeStr)
            );
            return ResponseEntity.ok(template);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> updateTemplate(@PathVariable Long id,
                                            @RequestBody Map<String, Object> request,
                                            @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            WeeklyTemplate template = templateService.getTemplateById(id);

            if (!template.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            // ✅ Обработка 24:00 → 00:00
            String startTimeStr = request.get("startTime").toString();
            String endTimeStr = request.get("endTime").toString();

            if ("24:00:00".equals(startTimeStr) || "24:00".equals(startTimeStr)) startTimeStr = "00:00:00";
            if ("24:00:00".equals(endTimeStr) || "24:00".equals(endTimeStr)) endTimeStr = "00:00:00";

            WeeklyTemplate updatedTemplate = templateService.updateTemplate(
                    id,
                    Long.parseLong(request.get("studentId").toString()),
                    request.get("courseId") != null ? Long.parseLong(request.get("courseId").toString()) : null,
                    Integer.parseInt(request.get("dayOfWeek").toString()),
                    LocalTime.parse(startTimeStr),
                    LocalTime.parse(endTimeStr)
            );
            return ResponseEntity.ok(updatedTemplate);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                          @RequestBody Map<String, String> request,
                                          @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            WeeklyTemplate template = templateService.getTemplateById(id);

            if (!template.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            WeeklyTemplate updatedTemplate = templateService.updateStatus(id, request.get("status"));
            return ResponseEntity.ok(updatedTemplate);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> deleteTemplate(@PathVariable Long id,
                                            @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            WeeklyTemplate template = templateService.getTemplateById(id);

            if (!template.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            LocalDate today = LocalDate.now();
            int deletedLessons = lessonRepository.deleteFutureLessonsByTemplateId(id, today);

            templateService.deleteTemplate(id);

            String message = deletedLessons > 0
                    ? "Шаблон и " + deletedLessons + " будущих занятий удалены"
                    : "Шаблон удалён (будущих занятий не было)";

            return ResponseEntity.ok(Map.of(
                    "message", message,
                    "deletedLessons", deletedLessons
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}