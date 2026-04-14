package com.example.demo.controller;

import com.example.demo.entity.ProgressRecord;
import com.example.demo.service.ProgressService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/progress")
@CrossOrigin(origins = "http://localhost:3000")
public class ProgressController {

    @Autowired
    private ProgressService progressService;

    @PostMapping
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> createProgressRecord(@RequestBody Map<String, Object> request,
                                                  @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            ProgressRecord record = progressService.createProgressRecord(
                    Long.parseLong(request.get("studentId").toString()),
                    request.get("courseId") != null ? Long.parseLong(request.get("courseId").toString()) : null,
                    (String) request.get("topic"),
                    request.get("score") != null ? Integer.parseInt(request.get("score").toString()) : null,
                    request.get("grade") != null ? Integer.parseInt(request.get("grade").toString()) : null,
                    (String) request.get("notes")
            );
            return ResponseEntity.ok(record);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/from-homework/{homeworkId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> createFromHomework(@PathVariable Long homeworkId) {
        try {
            ProgressRecord record = progressService.createFromHomework(homeworkId);
            return ResponseEntity.ok(record);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT', 'PARENT')")
    public ResponseEntity<?> getStudentProgress(@PathVariable Long studentId,
                                                @RequestAttribute(name = "userId", required = false) Long currentUserId,
                                                @RequestAttribute(name = "userRole", required = false) String userRole) {
        try {
            // Проверка прав
            if ("ROLE_STUDENT".equals(userRole) && !studentId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            List<ProgressRecord> records = progressService.getStudentProgress(studentId);
            return ResponseEntity.ok(records);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/student/{studentId}/stats")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT', 'PARENT')")
    public ResponseEntity<?> getStudentProgressStats(@PathVariable Long studentId,
                                                     @RequestAttribute(name = "userId", required = false) Long currentUserId,
                                                     @RequestAttribute(name = "userRole", required = false) String userRole) {
        try {
            if ("ROLE_STUDENT".equals(userRole) && !studentId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            Map<String, Object> stats = progressService.getStudentProgressStats(studentId);
            return ResponseEntity.ok(stats);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/student/{studentId}/course/{courseId}")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT', 'PARENT')")
    public ResponseEntity<?> getStudentProgressByCourse(@PathVariable Long studentId,
                                                        @PathVariable Long courseId,
                                                        @RequestAttribute(name = "userId", required = false) Long currentUserId,
                                                        @RequestAttribute(name = "userRole", required = false) String userRole) {
        try {
            if ("ROLE_STUDENT".equals(userRole) && !studentId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            List<ProgressRecord> records = progressService.getStudentProgressByCourse(studentId, courseId);
            return ResponseEntity.ok(records);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/tutor/{tutorId}/comparison")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getComparisonStats(@PathVariable Long tutorId,
                                                @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        if (!tutorId.equals(currentUserId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
        }

        try {
            Map<String, Object> stats = progressService.getComparisonStats(tutorId);
            return ResponseEntity.ok(stats);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}