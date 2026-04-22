package com.example.demo.controller;

import com.example.demo.entity.Course;
import com.example.demo.service.CourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.example.demo.repository.CourseRepository;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/courses")
@CrossOrigin(origins = "http://localhost:3000")
public class CourseController {

    @Autowired
    private CourseService courseService;

    @Autowired
    private CourseRepository courseRepository;
    // Создать новый курс
    @PostMapping
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> createCourse(@RequestBody Map<String, Object> request,
                                          @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Long tutorId = Long.parseLong(request.get("tutorId").toString());

            if (!tutorId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            String courseName = (String) request.get("name");

            if (courseRepository.existsByTutorIdAndName(tutorId, courseName)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Курс с таким названием уже существует"));
            }

            // Получаем subjectId из запроса
            Long subjectId = request.get("subjectId") != null ?
                    Long.parseLong(request.get("subjectId").toString()) : null;

            Course course = courseService.createCourse(
                    courseName,
                    (String) request.get("description"),
                    (String) request.get("color"),
                    tutorId,
                    subjectId  // ← добавить параметр в сервис
            );
            return ResponseEntity.ok(course);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Получить все курсы репетитора
    @GetMapping("/tutor/{tutorId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getCoursesByTutor(@PathVariable Long tutorId,
                                               @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            // ✅ IDOR FIX: Репетитор может видеть только СВОИ курсы
            if (!tutorId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            List<Course> courses = courseService.getCoursesByTutor(tutorId);
            return ResponseEntity.ok(courses);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Получить курс по ID
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getCourseById(@PathVariable Long id,
                                           @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Course course = courseService.getCourseById(id);

            // ✅ IDOR FIX: Проверяем, что курс принадлежит текущему репетитору
            if (!course.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            return ResponseEntity.ok(course);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Обновить курс
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> updateCourse(@PathVariable Long id,
                                          @RequestBody Map<String, Object> request,
                                          @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Course course = courseService.getCourseById(id);

            // IDOR FIX: Проверяем, что курс принадлежит текущему репетитору
            if (!course.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            // Получаем subjectId из запроса
            Long subjectId = request.get("subjectId") != null ?
                    Long.parseLong(request.get("subjectId").toString()) : null;

            Course updatedCourse = courseService.updateCourse(
                    id,
                    (String) request.get("name"),
                    (String) request.get("description"),
                    (String) request.get("color"),
                    subjectId  // ← ПЯТЫЙ АРГУМЕНТ
            );
            return ResponseEntity.ok(updatedCourse);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Удалить курс
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> deleteCourse(@PathVariable Long id,
                                          @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Course course = courseService.getCourseById(id);

            // ✅ IDOR FIX: Проверяем, что курс принадлежит текущему репетитору
            if (!course.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            courseService.deleteCourse(id);
            return ResponseEntity.ok(Map.of("message", "Курс успешно удалён"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Проверить, существует ли курс с таким названием
    @GetMapping("/exists")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> checkCourseExists(@RequestParam String name,
                                               @RequestParam Long tutorId,
                                               @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            // ✅ IDOR FIX: Проверяем, что запрос для своего аккаунта
            if (!tutorId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            boolean exists = courseService.existsByNameAndTutor(name, tutorId);
            return ResponseEntity.ok(Map.of("exists", exists));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}