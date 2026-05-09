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
        Long studentId = request.get("studentId") != null ? Long.valueOf(request.get("studentId").toString()) : null;
        Long lessonId = request.get("lessonId") != null ? Long.valueOf(request.get("lessonId").toString()) : null;
        String title = request.get("title") != null ? request.get("title").toString() : "Доска";
        String url = request.get("url") != null ? request.get("url").toString() : "";

        BoardSession session = boardSessionService.createBoard(tutorId, studentId, lessonId, title, url);

        return ResponseEntity.ok(Map.of(
                "id", session.getId(),
                "roomName", session.getRoomName(),
                "url", session.getUrl(),
                "title", session.getTitle(),
                "studentName", session.getStudent() != null ? session.getStudent().getFullName() : "",
                "createdAt", session.getCreatedAt().toString()
        ));
    }

    @GetMapping("/tutor")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getTutorBoards(@RequestAttribute("userId") Long tutorId) {
        return ResponseEntity.ok(boardSessionService.getTutorBoards(tutorId));
    }

    @GetMapping("/student")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT')")
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
                "url", session.getUrl(),
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

    @PutMapping("/{id}/save-canvas")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT')")
    public ResponseEntity<?> saveCanvas(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            BoardSession board = boardSessionService.getById(id);
            board.setCanvasImage(request.get("image"));
            boardSessionService.save(board);
            return ResponseEntity.ok(Map.of("message", "Сохранено"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/canvas")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT')")
    public ResponseEntity<?> getCanvas(@PathVariable Long id) {
        try {
            BoardSession board = boardSessionService.getById(id);
            return ResponseEntity.ok(Map.of("image", board.getCanvasImage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}