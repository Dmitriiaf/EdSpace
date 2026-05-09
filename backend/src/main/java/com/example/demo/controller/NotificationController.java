package com.example.demo.controller;

import com.example.demo.entity.Notification;
import com.example.demo.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:3000")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping("/parent/{parentId}")
    @PreAuthorize("hasAnyRole('TUTOR', 'PARENT')")
    public ResponseEntity<?> getNotifications(@PathVariable Long parentId) {
        try {
            List<Notification> notifications = notificationService.getNotificationsByParent(parentId);

            List<Map<String, Object>> result = notifications.stream().map(n -> {
                Map<String, Object> dto = new HashMap<>();
                dto.put("id", n.getId());
                dto.put("message", n.getMessage());
                dto.put("isRead", n.isRead());
                dto.put("createdAt", n.getCreatedAt());
                dto.put("tutorId", n.getTutorId());

                if (n.getLesson() != null) {
                    Map<String, Object> lessonInfo = new HashMap<>();
                    lessonInfo.put("id", n.getLesson().getId());
                    lessonInfo.put("lessonDate", n.getLesson().getLessonDate());
                    lessonInfo.put("startTime", n.getLesson().getStartTime());
                    lessonInfo.put("endTime", n.getLesson().getEndTime());
                    lessonInfo.put("status", n.getLesson().getStatus());

                    if (n.getLesson().getCourse() != null) {
                        lessonInfo.put("courseName", n.getLesson().getCourse().getName());
                    }

                    dto.put("lesson", lessonInfo);
                }

                return dto;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/parent/{parentId}/unread")
    @PreAuthorize("hasAnyRole('TUTOR', 'PARENT')")
    public ResponseEntity<?> getUnreadNotifications(@PathVariable Long parentId) {
        try {
            List<Notification> notifications = notificationService.getUnreadNotifications(parentId);

            List<Map<String, Object>> result = notifications.stream().map(n -> {
                Map<String, Object> dto = new HashMap<>();
                dto.put("id", n.getId());
                dto.put("message", n.getMessage());
                dto.put("isRead", n.isRead());
                dto.put("createdAt", n.getCreatedAt());
                dto.put("tutorId", n.getTutorId());

                if (n.getLesson() != null) {
                    dto.put("lessonId", n.getLesson().getId());
                    dto.put("lessonDate", n.getLesson().getLessonDate());
                    if (n.getLesson().getCourse() != null) {
                        dto.put("courseName", n.getLesson().getCourse().getName());
                    }
                }

                return dto;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/parent/{parentId}/unread-count")
    @PreAuthorize("hasAnyRole('TUTOR', 'PARENT')")
    public ResponseEntity<?> getUnreadCount(@PathVariable Long parentId) {
        try {
            long count = notificationService.getUnreadCount(parentId);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/read")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT', 'PARENT')")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        try {
            Notification notification = notificationService.markAsRead(id);

            Map<String, Object> dto = new HashMap<>();
            dto.put("id", notification.getId());
            dto.put("message", notification.getMessage());
            dto.put("isRead", notification.isRead());
            dto.put("createdAt", notification.getCreatedAt());

            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/parent/{parentId}/read-all")
    @PreAuthorize("hasAnyRole('TUTOR', 'PARENT')")
    public ResponseEntity<?> markAllAsRead(@PathVariable Long parentId) {
        try {
            notificationService.markAllAsRead(parentId);
            return ResponseEntity.ok(Map.of("message", "Все уведомления прочитаны"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== ЭНДПОИНТЫ ДЛЯ УЧЕНИКОВ И РЕПЕТИТОРОВ ==========

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT')")
    public ResponseEntity<?> getStudentNotifications(@PathVariable Long studentId) {
        try {
            return ResponseEntity.ok(notificationService.getNotificationsByStudent(studentId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/student/{studentId}/unread-count")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT')")
    public ResponseEntity<?> getStudentUnreadCount(@PathVariable Long studentId) {
        try {
            return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCountByStudent(studentId)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/tutor/{tutorId}")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT')")
    public ResponseEntity<?> getTutorNotifications(@PathVariable Long tutorId) {
        try {
            return ResponseEntity.ok(notificationService.getNotificationsByTutor(tutorId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/tutor/{tutorId}/read-all")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> markAllAsReadForTutor(@PathVariable Long tutorId) {
        try {
            notificationService.markAllAsReadForTutor(tutorId);
            return ResponseEntity.ok(Map.of("message", "Все уведомления прочитаны"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/student/{studentId}/read-all")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT')")
    public ResponseEntity<?> markAllAsReadForStudent(@PathVariable Long studentId) {
        try {
            notificationService.markAllAsReadForStudent(studentId);
            return ResponseEntity.ok(Map.of("message", "Все уведомления прочитаны"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }



    @GetMapping("/tutor/{tutorId}/unread-count")
    @PreAuthorize("hasAnyRole('TUTOR')")
    public ResponseEntity<?> getTutorUnreadCount(@PathVariable Long tutorId) {
        try {
            return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCountByTutor(tutorId)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}