package com.example.demo.controller;

import com.example.demo.entity.Lesson;
import com.example.demo.service.LessonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/jitsi")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://72.56.238.224",
        "http://ed-space.ru"
}, allowCredentials = "true")
public class JitsiController {

    @Autowired
    private LessonService lessonService;

    @GetMapping("/room/{lessonId}")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT')")
    public ResponseEntity<?> getRoomInfo(@PathVariable Long lessonId,
                                         @RequestAttribute("userId") Long currentUserId,
                                         @RequestAttribute("userRole") String userRole) {
        try {
            Lesson lesson = lessonService.getLessonById(lessonId);

            // IDOR FIX: Проверяем права доступа
            if ("ROLE_TUTOR".equals(userRole)) {
                boolean hasTutor = lesson.getStudent().getTutors().stream()
                        .anyMatch(t -> t.getId().equals(currentUserId));
                if (!hasTutor) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }
            } else if ("ROLE_STUDENT".equals(userRole)) {
                if (!lesson.getStudent().getId().equals(currentUserId)) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }
            }

            // ✅ Комната репетитора (одна на все уроки)
            String roomName = lesson.getTutor().getVideoRoomName();
            String roomUrl = "https://meet.jit.si/" + roomName;

            // ✅ Для ученика: если урок ещё не начат — показываем комнату ожидания
            boolean waitingRoom = "ROLE_STUDENT".equals(userRole) &&
                    Lesson.STATUS_SCHEDULED.equals(lesson.getStatus());

            // ✅ Если урок отменён или завершён — ученик не может войти
            if ("ROLE_STUDENT".equals(userRole)) {
                if (Lesson.STATUS_CANCELLED.equals(lesson.getStatus())) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Урок отменён"));
                }
                if (Lesson.STATUS_COMPLETED.equals(lesson.getStatus()) ||
                        Lesson.STATUS_PAID.equals(lesson.getStatus())) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Урок уже завершён"));
                }
            }

            String displayName = "ROLE_TUTOR".equals(userRole) ?
                    lesson.getTutor().getFullName() :
                    lesson.getStudent().getFullName();

            return ResponseEntity.ok(Map.of(
                    "roomUrl", roomUrl,
                    "roomName", roomName,
                    "waitingRoom", waitingRoom,
                    "displayName", displayName,
                    "courseName", lesson.getCourse() != null ? lesson.getCourse().getName() : "Занятие",
                    "status", lesson.getStatus()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}