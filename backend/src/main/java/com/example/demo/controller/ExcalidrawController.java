package com.example.demo.controller;

import com.example.demo.entity.Lesson;
import com.example.demo.service.LessonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/excalidraw")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://72.56.238.224",
        "http://ed-space.ru"
}, allowCredentials = "true")
public class ExcalidrawController {

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

            // ✅ ВРЕМЕННО: привязываем доску к уроку
            // В бэклоге: привязать к tutor + student + course
            String boardRoomName = lesson.getBoardRoomName();
            if (boardRoomName == null || boardRoomName.isEmpty()) {
                boardRoomName = "edspace-board-" + lessonId + "-" + UUID.randomUUID().toString().substring(0, 8);
                lesson.setBoardRoomName(boardRoomName);
                lessonService.saveLesson(lesson);
            }

            String roomUrl = "https://excalidraw.com/#room=" + boardRoomName;

            String displayName = "ROLE_TUTOR".equals(userRole) ?
                    lesson.getTutor().getFullName() :
                    lesson.getStudent().getFullName();

            return ResponseEntity.ok(Map.of(
                    "roomUrl", roomUrl,
                    "roomName", boardRoomName,
                    "displayName", displayName,
                    "courseName", lesson.getCourse() != null ? lesson.getCourse().getName() : "Занятие"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}