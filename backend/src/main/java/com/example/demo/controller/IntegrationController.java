package com.example.demo.controller;

import com.example.demo.entity.Homework;
import com.example.demo.entity.TaskBank;
import com.example.demo.service.ExternalIntegrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/integration")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://72.56.238.224",
        "http://ed-space.ru"
}, allowCredentials = "true")
public class IntegrationController {

    @Autowired
    private ExternalIntegrationService integrationService;

    @PostMapping("/tasks")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> createTask(@RequestBody Map<String, Object> request,
                                        @RequestAttribute("userId") Long tutorId) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> params = (Map<String, Object>) request;
            TaskBank task = integrationService.createTask(params, tutorId);
            return ResponseEntity.ok(task);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/import/kege")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> importFromKEGE(@RequestBody Map<String, String> request,
                                            @RequestAttribute("userId") Long tutorId) {
        try {
            String subject = request.get("subject");
            String examType = request.get("examType");

            List<TaskBank> imported = integrationService.importFromKEGE(subject, examType, tutorId);

            return ResponseEntity.ok(Map.of(
                    "message", "Импортировано заданий: " + imported.size(),
                    "count", imported.size(),
                    "tasks", imported
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/import/reshuege")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> importFromReshUEGE(@RequestBody Map<String, String> request,
                                                @RequestAttribute("userId") Long tutorId) {
        try {
            String subject = request.get("subject");
            String examType = request.get("examType");

            List<TaskBank> imported = integrationService.importFromReshUEGE(subject, examType, tutorId);

            return ResponseEntity.ok(Map.of(
                    "message", "Импортировано заданий: " + imported.size(),
                    "count", imported.size(),
                    "tasks", imported
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/tasks/search")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> searchTasks(@RequestParam(required = false) String query,
                                         @RequestParam(required = false) String subject,
                                         @RequestParam(required = false) String examType,
                                         @RequestParam(required = false) String source,
                                         @RequestAttribute("userId") Long tutorId) {
        try {
            List<TaskBank> tasks = integrationService.searchTasks(
                    query != null ? query : "",
                    subject,
                    examType,
                    source,
                    tutorId
            );
            return ResponseEntity.ok(tasks);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/tasks/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getTaskById(@PathVariable Long id,
                                         @RequestAttribute("userId") Long tutorId) {
        try {
            TaskBank task = integrationService.getTaskForHomework(id);

            if (task.getTutor() != null &&
                    !task.getTutor().getId().equals(tutorId) &&
                    !Boolean.TRUE.equals(task.getIsPublic())) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            return ResponseEntity.ok(task);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/tasks/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> deleteTask(@PathVariable Long id,
                                        @RequestAttribute("userId") Long tutorId) {
        try {
            TaskBank task = integrationService.getTaskForHomework(id);

            // Проверка что задание принадлежит репетитору
            if (task.getTutor() != null && !task.getTutor().getId().equals(tutorId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            integrationService.deleteTask(id);
            return ResponseEntity.ok(Map.of("message", "Задание удалено"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/create-homework-from-task")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> createHomeworkFromTask(@RequestBody Map<String, Object> request,
                                                    @RequestAttribute("userId") Long currentUserId) {
        try {
            Long taskId = Long.parseLong(request.get("taskId").toString());
            Long studentId = Long.parseLong(request.get("studentId").toString());

            TaskBank task = integrationService.getTaskForHomework(taskId);
            if (task.getTutor() != null &&
                    !task.getTutor().getId().equals(currentUserId) &&
                    !Boolean.TRUE.equals(task.getIsPublic())) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            LocalDateTime dueDate = null;
            if (request.get("dueDate") != null) {
                dueDate = LocalDateTime.parse(request.get("dueDate").toString());
            }

            Homework homework = integrationService.createHomeworkFromTask(
                    taskId, currentUserId, studentId, dueDate
            );

            return ResponseEntity.ok(Map.of(
                    "message", "Домашнее задание создано из задания",
                    "homework", homework
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}