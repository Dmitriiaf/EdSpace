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

@RestController
@RequestMapping("/api/weekly-template")
@CrossOrigin(origins = "http://localhost:3000")
public class WeeklyTemplateController {

    @Autowired
    private WeeklyTemplateService templateService;

    @GetMapping("/tutor/{tutorId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getTemplates(@PathVariable Long tutorId,
                                          @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            // ✅ IDOR FIX: Репетитор может видеть только СВОИ шаблоны
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

            // ✅ IDOR FIX: Проверяем, что репетитор создаёт шаблон для себя
            if (!tutorId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            WeeklyTemplate template = templateService.createTemplate(
                    tutorId,
                    Long.parseLong(request.get("studentId").toString()),
                    request.get("courseId") != null ? Long.parseLong(request.get("courseId").toString()) : null,
                    Integer.parseInt(request.get("dayOfWeek").toString()),
                    LocalTime.parse(request.get("startTime").toString()),
                    LocalTime.parse(request.get("endTime").toString())
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

            // ✅ IDOR FIX: Проверяем, что шаблон принадлежит текущему репетитору
            if (!template.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            WeeklyTemplate updatedTemplate = templateService.updateTemplate(
                    id,
                    Long.parseLong(request.get("studentId").toString()),
                    request.get("courseId") != null ? Long.parseLong(request.get("courseId").toString()) : null,
                    Integer.parseInt(request.get("dayOfWeek").toString()),
                    LocalTime.parse(request.get("startTime").toString()),
                    LocalTime.parse(request.get("endTime").toString())
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

            // ✅ IDOR FIX: Проверяем, что шаблон принадлежит текущему репетитору
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

            // ✅ IDOR FIX: Проверяем, что шаблон принадлежит текущему репетитору
            if (!template.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            templateService.deleteTemplate(id);
            return ResponseEntity.ok(Map.of("message", "Шаблон удалён"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}