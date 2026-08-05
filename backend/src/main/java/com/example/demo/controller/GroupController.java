package com.example.demo.controller;

import com.example.demo.entity.Group;
import com.example.demo.entity.Lesson;
import com.example.demo.entity.Student;
import com.example.demo.repository.LessonRepository;
import com.example.demo.service.GroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://ed-space.ru",
        "https://ed-space.ru",
        "https://www.ed-space.ru"
}, allowCredentials = "true")
public class GroupController {

    @Autowired
    private GroupService groupService;

    @Autowired
    private LessonRepository lessonRepository;

    // Создать группу
    @PostMapping
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> createGroup(@RequestBody Map<String, Object> request,
                                         @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            String name = (String) request.get("name");
            Long courseId = request.get("courseId") != null ?
                    Long.parseLong(request.get("courseId").toString()) : null;

            Group group = groupService.createGroup(
                    currentUserId,
                    courseId,
                    name,
                    (String) request.get("description"),
                    request.get("maxStudents") != null ?
                            Integer.parseInt(request.get("maxStudents").toString()) : null,
                    request.get("pricePerStudent") != null ?
                            Double.parseDouble(request.get("pricePerStudent").toString()) : null,
                    (String) request.getOrDefault("status", "active")
            );

            if (request.containsKey("studentIds")) {
                List<Integer> studentIds = (List<Integer>) request.get("studentIds");
                for (Integer sid : studentIds) {
                    groupService.addStudentToGroup(group.getId(), sid.longValue());
                }
                group = groupService.getGroupById(group.getId());
            }

            return ResponseEntity.ok(group);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Получить все группы репетитора
    @GetMapping("/tutor/{tutorId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getGroupsByTutor(@PathVariable Long tutorId,
                                              @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            if (!tutorId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }
            List<Group> groups = groupService.getGroupsByTutor(tutorId);
            return ResponseEntity.ok(groups);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Получить группу по ID
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getGroupById(@PathVariable Long id,
                                          @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Group group = groupService.getGroupById(id);
            if (!group.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }
            return ResponseEntity.ok(group);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Обновить информацию о группе
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> updateGroup(@PathVariable Long id,
                                         @RequestBody Map<String, Object> request,
                                         @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Group group = groupService.getGroupById(id);
            if (!group.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            Group updatedGroup = groupService.updateGroup(
                    id,
                    (String) request.get("name"),
                    (String) request.get("description"),
                    request.get("maxStudents") != null ? Integer.parseInt(request.get("maxStudents").toString()) : null,
                    request.get("pricePerStudent") != null ? Double.parseDouble(request.get("pricePerStudent").toString()) : null,
                    (String) request.get("status")
            );

            if (request.containsKey("studentIds")) {
                List<Integer> newStudentIds = (List<Integer>) request.get("studentIds");
                List<Student> currentStudents = new ArrayList<>(updatedGroup.getStudents());
                for (Student s : currentStudents) {
                    if (!newStudentIds.contains(s.getId().intValue())) {
                        groupService.removeStudentFromGroup(id, s.getId());
                    }
                }
                for (Integer sid : newStudentIds) {
                    if (updatedGroup.getStudents().stream().noneMatch(s -> s.getId().equals(sid.longValue()))) {
                        groupService.addStudentToGroup(id, sid.longValue());
                    }
                }
                updatedGroup = groupService.getGroupById(id);
            }

            return ResponseEntity.ok(updatedGroup);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ ОТМЕНИТЬ ВСЕ УРОКИ ГРУППЫ
    @PostMapping("/{id}/cancel-lessons")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> cancelGroupLessons(@PathVariable Long id,
                                                @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Group group = groupService.getGroupById(id);
            if (!group.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            List<Lesson> lessons = lessonRepository.findByGroupIdAndLessonDateAfter(id, LocalDate.now().minusDays(1));
            int count = 0;
            for (Lesson l : lessons) {
                if (l.getStatus().equals("SCHEDULED") || l.getStatus().equals("IN_PROGRESS")) {
                    l.setStatus("CANCELLED");
                    l.setUpdatedAt(LocalDateTime.now());
                    lessonRepository.save(l);
                    count++;
                }
            }
            return ResponseEntity.ok(Map.of("message", "✅ Отменено " + count + " уроков группы «" + group.getName() + "»"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Добавить ученика в группу
    @PatchMapping("/{groupId}/add-student/{studentId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> addStudentToGroup(@PathVariable Long groupId,
                                               @PathVariable Long studentId,
                                               @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Group group = groupService.getGroupById(groupId);
            if (!group.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }
            Group updatedGroup = groupService.addStudentToGroup(groupId, studentId);
            return ResponseEntity.ok(updatedGroup);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Удалить ученика из группы
    @PatchMapping("/{groupId}/remove-student/{studentId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> removeStudentFromGroup(@PathVariable Long groupId,
                                                    @PathVariable Long studentId,
                                                    @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Group group = groupService.getGroupById(groupId);
            if (!group.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }
            Group updatedGroup = groupService.removeStudentFromGroup(groupId, studentId);
            return ResponseEntity.ok(updatedGroup);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{groupId}/students")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getStudentsInGroup(@PathVariable Long groupId,
                                                @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Group group = groupService.getGroupById(groupId);
            if (!group.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }
            List<Student> students = groupService.getStudentsInGroup(groupId);
            return ResponseEntity.ok(students);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{groupId}/students-count")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getStudentsCount(@PathVariable Long groupId,
                                              @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Group group = groupService.getGroupById(groupId);
            if (!group.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }
            int count = groupService.getStudentsCount(groupId);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{groupId}/has-available-seats")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> hasAvailableSeats(@PathVariable Long groupId,
                                               @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Group group = groupService.getGroupById(groupId);
            if (!group.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }
            boolean hasSeats = groupService.hasAvailableSeats(groupId);
            return ResponseEntity.ok(Map.of("hasAvailableSeats", hasSeats));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/course/{courseId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getGroupsByCourse(@PathVariable Long courseId,
                                               @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            List<Group> groups = groupService.getGroupsByCourse(courseId);
            groups = groups.stream()
                    .filter(g -> g.getTutor().getId().equals(currentUserId))
                    .toList();
            return ResponseEntity.ok(groups);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> deleteGroup(@PathVariable Long id,
                                         @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Group group = groupService.getGroupById(id);
            if (!group.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }
            groupService.deleteGroup(id);
            return ResponseEntity.ok(Map.of("message", "Группа успешно удалена"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/tutor/{tutorId}/status/{status}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getGroupsByStatus(@PathVariable Long tutorId,
                                               @PathVariable String status,
                                               @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            if (!tutorId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }
            List<Group> groups = groupService.getGroupsByStatus(tutorId, status);
            return ResponseEntity.ok(groups);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/stats/{tutorId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getGroupStats(@PathVariable Long tutorId,
                                           @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            if (!tutorId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }
            Map<String, Object> stats = groupService.getGroupStats(tutorId);
            return ResponseEntity.ok(stats);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}