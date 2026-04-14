package com.example.demo.controller;

import com.example.demo.service.ExportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/export")
@CrossOrigin(origins = "http://localhost:3000")
public class ExportController {

    @Autowired
    private ExportService exportService;

    @GetMapping("/student-progress/{studentId}")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT', 'PARENT')")
    public ResponseEntity<?> exportStudentProgress(
            @PathVariable Long studentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false, defaultValue = "json") String format) {

        try {
            if (startDate == null) {
                startDate = LocalDateTime.now().minusMonths(3);
            }
            if (endDate == null) {
                endDate = LocalDateTime.now();
            }

            Map<String, Object> report = exportService.generateStudentProgressReport(studentId, startDate, endDate);

            if ("csv".equalsIgnoreCase(format)) {
                // Для CSV потребуется дополнительная конвертация
                // Пока возвращаем JSON
                return ResponseEntity.ok(report);
            }

            return ResponseEntity.ok(report);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/financial")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> exportFinancialReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestAttribute(name = "userId", required = false) Long currentUserId) {

        try {
            Map<String, Object> report = exportService.generateFinancialReport(currentUserId, startDate, endDate);
            return ResponseEntity.ok(report);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/course")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> exportCourseReport(
            @RequestParam(required = false) Long courseId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestAttribute(name = "userId", required = false) Long currentUserId) {

        try {
            Map<String, Object> report = exportService.generateCourseReport(currentUserId, courseId, startDate, endDate);
            return ResponseEntity.ok(report);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}