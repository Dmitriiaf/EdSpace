package com.example.demo.controller;

import com.example.demo.entity.Lesson;
import com.example.demo.service.LessonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/lesson-notes")
@CrossOrigin(origins = "http://localhost:3000")
public class LessonNotesController {

    @Autowired
    private LessonService lessonService;

    @PatchMapping("/{id}")
    public ResponseEntity<?> updateNotes(@PathVariable Long id,
                                         @RequestBody Map<String, String> request) {
        try {
            String notes = request.get("notes");
            String nextLessonPlan = request.get("nextLessonPlan");

            Lesson lesson = lessonService.addNotes(id, notes, nextLessonPlan);

            return ResponseEntity.ok(Map.of(
                    "message", "Заметки сохранены",
                    "lesson", lesson
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}