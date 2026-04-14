package com.example.demo.controller;

import com.example.demo.entity.Notification;
import com.example.demo.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<?> getNotifications(@PathVariable Long parentId) {
        try {
            List<Notification> notifications = notificationService.getNotificationsByParent(parentId);

            // ✅ Преобразуем в DTO, чтобы избежать LazyInitializationException
            List<Map<String, Object>> result = notifications.stream().map(n -> {
                Map<String, Object> dto = new HashMap<>();
                dto.put("id", n.getId());
                dto.put("message", n.getMessage());
                dto.put("isRead", n.isRead());
                dto.put("createdAt", n.getCreatedAt());
                dto.put("tutorId", n.getTutorId());

                // Безопасно добавляем информацию о занятии
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
    public ResponseEntity<?> getUnreadNotifications(@PathVariable Long parentId) {
        try {
            List<Notification> notifications = notificationService.getUnreadNotifications(parentId);

            // ✅ Преобразуем в DTO
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
    public ResponseEntity<?> getUnreadCount(@PathVariable Long parentId) {
        try {
            long count = notificationService.getUnreadCount(parentId);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        try {
            Notification notification = notificationService.markAsRead(id);

            // ✅ Возвращаем DTO
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
    public ResponseEntity<?> markAllAsRead(@PathVariable Long parentId) {
        try {
            notificationService.markAllAsRead(parentId);
            return ResponseEntity.ok(Map.of("message", "Все уведомления прочитаны"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}