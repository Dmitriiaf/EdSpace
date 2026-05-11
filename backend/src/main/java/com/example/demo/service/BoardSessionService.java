// ========== backend/src/main/java/com/example/demo/service/BoardSessionService.java (МНОГО УЧЕНИКОВ) ==========
package com.example.demo.service;

import com.example.demo.entity.BoardSession;
import com.example.demo.entity.Lesson;
import com.example.demo.entity.Student;
import com.example.demo.entity.Tutor;
import com.example.demo.repository.BoardSessionRepository;
import com.example.demo.repository.TutorRepository;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.LessonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class BoardSessionService {

    @Autowired
    private BoardSessionRepository boardSessionRepository;

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private LessonRepository lessonRepository;

    @Transactional
    public BoardSession createBoard(Long tutorId, List<Long> studentIds, Long lessonId, String title, String url) {
        String roomName = "edspace-board-" + UUID.randomUUID().toString().substring(0, 8);

        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new RuntimeException("Репетитор не найден"));

        List<Student> students = new ArrayList<>();
        if (studentIds != null && !studentIds.isEmpty()) {
            students = studentRepository.findAllById(studentIds);
        }

        BoardSession.BoardSessionBuilder builder = BoardSession.builder()
                .roomName(roomName)
                .tutor(tutor)
                .students(students)
                .title(title)
                .url(url)
                .status("ACTIVE")
                .createdAt(LocalDateTime.now());

        // Обратная совместимость — первый ученик в student_id
        if (!students.isEmpty()) {
            builder.student(students.get(0));
        }

        if (lessonId != null) {
            Lesson lesson = lessonRepository.findById(lessonId)
                    .orElseThrow(() -> new RuntimeException("Урок не найден"));
            builder.lesson(lesson);
        }

        return boardSessionRepository.save(builder.build());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTutorBoards(Long tutorId) {
        List<BoardSession> boards = boardSessionRepository.findByTutorIdAndStatusOrderByCreatedAtDesc(tutorId, "ACTIVE");
        List<Map<String, Object>> result = new ArrayList<>();
        for (BoardSession b : boards) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", b.getId());
            map.put("roomName", b.getRoomName());
            map.put("url", b.getUrl());
            map.put("title", b.getTitle());
            map.put("studentName", b.getStudentNames());
            map.put("studentIds", b.getStudentIds());
            map.put("studentCount", b.getStudents() != null ? b.getStudents().size() : 0);
            map.put("lessonId", b.getLesson() != null ? b.getLesson().getId() : null);
            map.put("createdAt", b.getCreatedAt().toString());
            result.add(map);
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getStudentBoards(Long studentId) {
        List<BoardSession> boards = boardSessionRepository.findByStudentIdAndStatusOrderByCreatedAtDesc(studentId, "ACTIVE");
        List<Map<String, Object>> result = new ArrayList<>();
        for (BoardSession b : boards) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", b.getId());
            map.put("roomName", b.getRoomName());
            map.put("url", b.getUrl());
            map.put("title", b.getTitle());
            map.put("tutorName", b.getTutor() != null ? b.getTutor().getFullName() : "");
            map.put("lessonId", b.getLesson() != null ? b.getLesson().getId() : null);
            map.put("createdAt", b.getCreatedAt().toString());
            result.add(map);
        }
        return result;
    }

    @Transactional
    public BoardSession updateBoard(Long boardId, String title, String url, List<Long> studentIds) {
        BoardSession board = boardSessionRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("Доска не найдена"));

        if (title != null) board.setTitle(title);
        if (url != null) board.setUrl(url);

        if (studentIds != null) {
            List<Student> newStudents = studentRepository.findAllById(studentIds);
            board.setStudents(newStudents);
            // Обратная совместимость
            if (!newStudents.isEmpty()) {
                board.setStudent(newStudents.get(0));
            } else {
                board.setStudent(null);
            }
        }

        board.setUpdatedAt(LocalDateTime.now());
        return boardSessionRepository.save(board);
    }

    public BoardSession getById(Long id) {
        return boardSessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Доска не найдена"));
    }

    public BoardSession getByRoomName(String roomName) {
        return boardSessionRepository.findByRoomName(roomName)
                .orElseThrow(() -> new RuntimeException("Доска не найдена"));
    }

    @Transactional
    public BoardSession archiveBoard(Long boardId) {
        BoardSession session = boardSessionRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("Доска не найдена"));
        session.setStatus("ARCHIVED");
        session.setArchivedAt(LocalDateTime.now());
        return boardSessionRepository.save(session);
    }

    @Transactional
    public void deleteBoard(Long boardId) {
        boardSessionRepository.deleteById(boardId);
    }

    public BoardSession getByLessonId(Long lessonId) {
        return boardSessionRepository.findByLessonIdAndStatus(lessonId, "ACTIVE").orElse(null);
    }

    @Transactional
    public int archiveOldBoards(int daysOld) {
        LocalDateTime threshold = LocalDateTime.now().minusDays(daysOld);
        List<BoardSession> oldBoards = boardSessionRepository
                .findByStatusAndUpdatedAtBefore("ACTIVE", threshold);
        int count = 0;
        for (BoardSession board : oldBoards) {
            board.setStatus("ARCHIVED");
            board.setArchivedAt(LocalDateTime.now());
            boardSessionRepository.save(board);
            count++;
        }
        return count;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getArchivedTutorBoards(Long tutorId) {
        List<BoardSession> boards = boardSessionRepository
                .findByTutorIdAndStatusOrderByCreatedAtDesc(tutorId, "ARCHIVED");
        List<Map<String, Object>> result = new ArrayList<>();
        for (BoardSession b : boards) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", b.getId());
            map.put("roomName", b.getRoomName());
            map.put("url", b.getUrl());
            map.put("title", b.getTitle());
            map.put("studentName", b.getStudentNames());
            map.put("studentIds", b.getStudentIds());
            map.put("studentCount", b.getStudents() != null ? b.getStudents().size() : 0);
            map.put("archivedAt", b.getArchivedAt() != null ? b.getArchivedAt().toString() : "");
            map.put("createdAt", b.getCreatedAt().toString());
            result.add(map);
        }
        return result;
    }

    @Transactional
    public BoardSession restoreBoard(Long boardId) {
        BoardSession session = boardSessionRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("Доска не найдена"));
        session.setStatus("ACTIVE");
        session.setArchivedAt(null);
        return boardSessionRepository.save(session);
    }

    @Transactional
    public BoardSession save(BoardSession board) {
        return boardSessionRepository.save(board);
    }
}