package com.example.demo.controller;

import com.example.demo.entity.StudentBoard;
import com.example.demo.entity.Student;
import com.example.demo.entity.Tutor;
import com.example.demo.repository.StudentBoardRepository;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.TutorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/board")
public class BoardController {

    @Autowired
    private StudentBoardRepository boardRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private TutorRepository tutorRepository;

    @GetMapping("/{studentId}/{tutorId}")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT')")
    public ResponseEntity<?> getBoard(@PathVariable Long studentId, @PathVariable Long tutorId) {
        StudentBoard board = boardRepository.findByStudentIdAndTutorId(studentId, tutorId)
                .orElseGet(() -> {
                    Student student = studentRepository.findById(studentId).orElseThrow();
                    Tutor tutor = tutorRepository.findById(tutorId).orElseThrow();
                    StudentBoard newBoard = new StudentBoard(student, tutor);
                    return boardRepository.save(newBoard);
                });
        return ResponseEntity.ok(Map.of("notes", board.getNotes()));
    }

    @PutMapping("/{studentId}/{tutorId}")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT')")
    public ResponseEntity<?> saveBoard(@PathVariable Long studentId, @PathVariable Long tutorId,
                                       @RequestBody Map<String, String> request) {
        StudentBoard board = boardRepository.findByStudentIdAndTutorId(studentId, tutorId)
                .orElseGet(() -> {
                    Student student = studentRepository.findById(studentId).orElseThrow();
                    Tutor tutor = tutorRepository.findById(tutorId).orElseThrow();
                    return new StudentBoard(student, tutor);
                });
        board.setNotes(request.get("notes"));
        boardRepository.save(board);
        return ResponseEntity.ok(Map.of("message", "Сохранено"));
    }
}