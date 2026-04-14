// ========== backend/src/main/java/com/example/demo/controller/StepikController.java (ПОЛНАЯ ЗАМЕНА) ==========
package com.example.demo.controller;

import com.example.demo.entity.StepikToken;
import com.example.demo.entity.StudentStepikCourse;
import com.example.demo.service.StepikService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stepik")
@CrossOrigin(origins = "http://localhost:3000")
public class StepikController {

    @Autowired
    private StepikService stepikService;

    @PostMapping("/token")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> exchangeToken(@RequestBody Map<String, String> request,
                                           @RequestAttribute("userId") Long tutorId) {
        try {
            String code = request.get("code");
            StepikToken token = stepikService.exchangeCodeForToken(tutorId, code);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Stepik успешно подключен",
                    "stepikUserId", token.getStepikUserId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/status")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getStatus(@RequestAttribute("userId") Long tutorId) {
        boolean connected = stepikService.isConnected(tutorId);
        return ResponseEntity.ok(Map.of("connected", connected));
    }

    @DeleteMapping("/disconnect")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> disconnect(@RequestAttribute("userId") Long tutorId) {
        stepikService.disconnect(tutorId);
        return ResponseEntity.ok(Map.of("message", "Stepik отключен"));
    }

    @GetMapping("/my-courses")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getMyCourses(@RequestAttribute("userId") Long tutorId) {
        try {
            String courses = stepikService.getMyCourses(tutorId);
            return ResponseEntity.ok(courses);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/courses/search")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> searchCourses(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "1") int page) {
        try {
            String courses = stepikService.searchCourses(query, page);
            return ResponseEntity.ok(courses);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/courses/featured")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getFeaturedCourses() {
        try {
            String courses = stepikService.getFeaturedCourses();
            return ResponseEntity.ok(courses);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/courses/{courseId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getCourseDetails(@PathVariable Long courseId) {
        try {
            String details = stepikService.getCourseDetails(courseId);
            return ResponseEntity.ok(details);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/courses/{courseId}/sections")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getCourseSections(@PathVariable Long courseId) {
        try {
            String sections = stepikService.getCourseSections(courseId);
            return ResponseEntity.ok(sections);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== НАЗНАЧЕНИЕ КУРСОВ ==========

    @PostMapping("/assign")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> assignCourse(@RequestBody Map<String, Object> request,
                                          @RequestAttribute("userId") Long tutorId) {
        try {
            Long studentId = Long.parseLong(request.get("studentId").toString());
            Long courseId = Long.parseLong(request.get("courseId").toString());
            String courseTitle = (String) request.get("courseTitle");

            StudentStepikCourse assignment = stepikService.assignCourseToStudent(
                    tutorId, studentId, courseId, courseTitle);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Курс назначен ученику",
                    "assignment", assignment
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/student/{studentId}/courses")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT', 'PARENT')")
    public ResponseEntity<?> getStudentCourses(@PathVariable Long studentId) {
        try {
            List<StudentStepikCourse> courses = stepikService.getStudentCourses(studentId);
            return ResponseEntity.ok(courses);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/assignments")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getAssignments(@RequestAttribute("userId") Long tutorId) {
        try {
            List<StudentStepikCourse> assignments = stepikService.getAssignedCoursesByTutor(tutorId);
            return ResponseEntity.ok(assignments);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/sync-progress")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> syncProgress(@RequestAttribute("userId") Long tutorId) {
        try {
            Map<String, Object> result = stepikService.syncAllProgress(tutorId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Прогресс синхронизирован",
                    "updated", result.get("updated"),
                    "total", result.get("total")
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }
}