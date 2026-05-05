package com.example.demo.controller;

import com.example.demo.entity.BoardSession;
import com.example.demo.service.BoardSessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/boards")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://72.56.238.224",
        "http://ed-space.ru",
        "https://ed-space.ru",
        "https://www.ed-space.ru"
}, allowCredentials = "true")
public class BoardSessionController {

    @Autowired
    private BoardSessionService boardSessionService;

    @PostMapping
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> createBoard(@RequestBody Map<String, Object> request,
                                         @RequestAttribute("userId") Long tutorId) {
        Long studentId = Long.valueOf(request.get("studentId").toString());
        Long lessonId = request.get("lessonId") != null ? Long.valueOf(request.get("lessonId").toString()) : null;
        String title = request.get("title") != null ? request.get("title").toString() : "Доска";

        BoardSession session = boardSessionService.createBoard(tutorId, studentId, lessonId, title);

        return ResponseEntity.ok(Map.of(
                "id", session.getId(),
                "roomName", session.getRoomName(),
                "roomUrl", "https://excalidraw.com/#room=" + session.getRoomName(),
                "title", session.getTitle(),
                "studentName", session.getStudent().getFullName(),
                "createdAt", session.getCreatedAt().toString()
        ));
    }

    @GetMapping("/tutor")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getTutorBoards(@RequestAttribute("userId") Long tutorId) {
        return ResponseEntity.ok(boardSessionService.getTutorBoards(tutorId));
    }

    @GetMapping("/student")
    @PreAuthorize("hasAnyRole('STUDENT')")
    public ResponseEntity<?> getStudentBoards(@RequestAttribute("userId") Long studentId) {
        return ResponseEntity.ok(boardSessionService.getStudentBoards(studentId));
    }

    @GetMapping("/lesson/{lessonId}")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT')")
    public ResponseEntity<?> getByLesson(@PathVariable Long lessonId) {
        BoardSession session = boardSessionService.getByLessonId(lessonId);
        if (session == null) {
            return ResponseEntity.ok(Map.of("exists", false));
        }
        return ResponseEntity.ok(Map.of(
                "exists", true,
                "roomUrl", "https://excalidraw.com/#room=" + session.getRoomName(),
                "title", session.getTitle()
        ));
    }

    @PutMapping("/{id}/archive")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> archiveBoard(@PathVariable Long id,
                                          @RequestAttribute("userId") Long tutorId) {
        BoardSession session = boardSessionService.getById(id);
        if (!session.getTutor().getId().equals(tutorId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
        }
        boardSessionService.archiveBoard(id);
        return ResponseEntity.ok(Map.of("message", "Доска архивирована"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> deleteBoard(@PathVariable Long id,
                                         @RequestAttribute("userId") Long tutorId) {
        BoardSession session = boardSessionService.getById(id);
        if (!session.getTutor().getId().equals(tutorId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
        }
        boardSessionService.deleteBoard(id);
        return ResponseEntity.ok(Map.of("message", "Доска удалена"));
    }

}