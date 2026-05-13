// ========== backend/src/main/java/com/example/demo/controller/BoardSessionController.java (МНОГО УЧЕНИКОВ) ==========
package com.example.demo.controller;

import com.example.demo.entity.BoardSession;
import com.example.demo.service.BoardSessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
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
        List<Long> studentIds = new ArrayList<>();
        if (request.containsKey("studentIds") && request.get("studentIds") instanceof List) {
            @SuppressWarnings("unchecked")
            List<Number> ids = (List<Number>) request.get("studentIds");
            for (Number id : ids) {
                studentIds.add(id.longValue());
            }
        } else if (request.get("studentId") != null) {
            studentIds.add(Long.valueOf(request.get("studentId").toString()));
        }

        Long lessonId = request.get("lessonId") != null ? Long.valueOf(request.get("lessonId").toString()) : null;
        String title = request.get("title") != null ? request.get("title").toString() : "Доска";
        String url = request.get("url") != null ? request.get("url").toString() : "";

        BoardSession session = boardSessionService.createBoard(tutorId, studentIds, lessonId, title, url);

        return ResponseEntity.ok(Map.of(
                "id", session.getId(),
                "roomName", session.getRoomName(),
                "encryptionKey", session.getEncryptionKey(),
                "url", session.getUrl(),
                "title", session.getTitle(),
                "studentName", session.getStudentNames(),
                "studentIds", session.getStudentIds(),
                "studentCount", session.getStudents() != null ? session.getStudents().size() : 0,
                "createdAt", session.getCreatedAt().toString()
        ));
    }

    @PutMapping("/save-session-url")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT')")
    public ResponseEntity<?> saveSessionUrl(@RequestBody Map<String, String> request) {
        String roomName = request.get("roomName");
        String sessionUrl = request.get("sessionUrl");

        BoardSession board = boardSessionService.getByRoomName(roomName);
        board.setUrl(sessionUrl);
        boardSessionService.save(board);

        return ResponseEntity.ok(Map.of("message", "URL сохранён"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> updateBoard(@PathVariable Long id,
                                         @RequestBody Map<String, Object> request,
                                         @RequestAttribute("userId") Long tutorId) {
        BoardSession session = boardSessionService.getById(id);
        if (!session.getTutor().getId().equals(tutorId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
        }

        String title = request.get("title") != null ? request.get("title").toString() : null;
        String url = request.get("url") != null ? request.get("url").toString() : null;

        List<Long> studentIds = null;
        if (request.containsKey("studentIds") && request.get("studentIds") instanceof List) {
            @SuppressWarnings("unchecked")
            List<Number> ids = (List<Number>) request.get("studentIds");
            studentIds = new ArrayList<>();
            for (Number num : ids) {
                studentIds.add(num.longValue());
            }
        } else if (request.get("studentId") != null) {
            studentIds = new ArrayList<>();
            studentIds.add(Long.valueOf(request.get("studentId").toString()));
        }

        BoardSession updated = boardSessionService.updateBoard(id, title, url, studentIds);

        return ResponseEntity.ok(Map.of(
                "id", updated.getId(),
                "title", updated.getTitle(),
                "url", updated.getUrl(),
                "studentName", updated.getStudentNames(),
                "studentIds", updated.getStudentIds(),
                "studentCount", updated.getStudents() != null ? updated.getStudents().size() : 0,
                "message", "Доска обновлена"
        ));
    }

    // ========== АРХИВНЫЕ ДОСКИ ==========

    @GetMapping("/tutor/archived")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getArchivedTutorBoards(@RequestAttribute("userId") Long tutorId) {
        return ResponseEntity.ok(boardSessionService.getArchivedTutorBoards(tutorId));
    }

    @PutMapping("/{id}/restore")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> restoreBoard(@PathVariable Long id,
                                          @RequestAttribute("userId") Long tutorId) {
        BoardSession session = boardSessionService.getById(id);
        if (!session.getTutor().getId().equals(tutorId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
        }
        boardSessionService.restoreBoard(id);
        return ResponseEntity.ok(Map.of("message", "Доска восстановлена"));
    }

    @PostMapping("/archive-old")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> archiveOldBoards(@RequestParam(defaultValue = "30") int days) {
        int count = boardSessionService.archiveOldBoards(days);
        return ResponseEntity.ok(Map.of("message", "Архивировано досок: " + count, "count", count));
    }

    // ========== ОСНОВНЫЕ ЭНДПОИНТЫ ==========

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
