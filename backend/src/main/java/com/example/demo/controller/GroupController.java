package com.example.demo.controller;

import com.example.demo.entity.Group;
import com.example.demo.entity.Student;
import com.example.demo.service.GroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
@CrossOrigin(origins = "http://localhost:3000")
public class GroupController {

    @Autowired
    private GroupService groupService;

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

            // ✅ Добавляем учеников, если переданы
            if (request.containsKey("studentIds")) {
                List<Integer> studentIds = (List<Integer>) request.get("studentIds");
                for (Integer sid : studentIds) {
                    groupService.addStudentToGroup(group.getId(), sid.longValue());
                }
                group = groupService.getGroupById(group.getId()); // обновляем с учениками
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
            // ✅ IDOR FIX: Репетитор может видеть только СВОИ группы
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

            // ✅ IDOR FIX: Проверяем, что группа принадлежит текущему репетитору
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

            // ✅ Синхронизируем учеников
            if (request.containsKey("studentIds")) {
                List<Integer> newStudentIds = (List<Integer>) request.get("studentIds");

                // Удаляем тех, кого нет в новом списке
                List<Student> currentStudents = new ArrayList<>(updatedGroup.getStudents());
                for (Student s : currentStudents) {
                    if (!newStudentIds.contains(s.getId().intValue())) {
                        groupService.removeStudentFromGroup(id, s.getId());
                    }
                }

                // Добавляем новых
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

    // Добавить ученика в группу
    @PatchMapping("/{groupId}/add-student/{studentId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> addStudentToGroup(@PathVariable Long groupId,
                                               @PathVariable Long studentId,
                                               @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Group group = groupService.getGroupById(groupId);

            // ✅ IDOR FIX: Проверяем, что группа принадлежит текущему репетитору
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

            // ✅ IDOR FIX: Проверяем, что группа принадлежит текущему репетитору
            if (!group.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            Group updatedGroup = groupService.removeStudentFromGroup(groupId, studentId);
            return ResponseEntity.ok(updatedGroup);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Получить всех учеников группы
    @GetMapping("/{groupId}/students")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getStudentsInGroup(@PathVariable Long groupId,
                                                @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Group group = groupService.getGroupById(groupId);

            // ✅ IDOR FIX: Проверяем, что группа принадлежит текущему репетитору
            if (!group.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            List<Student> students = groupService.getStudentsInGroup(groupId);
            return ResponseEntity.ok(students);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Получить количество учеников в группе
    @GetMapping("/{groupId}/students-count")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getStudentsCount(@PathVariable Long groupId,
                                              @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Group group = groupService.getGroupById(groupId);

            // ✅ IDOR FIX: Проверяем, что группа принадлежит текущему репетитору
            if (!group.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            int count = groupService.getStudentsCount(groupId);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Проверить, есть ли место в группе
    @GetMapping("/{groupId}/has-available-seats")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> hasAvailableSeats(@PathVariable Long groupId,
                                               @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Group group = groupService.getGroupById(groupId);

            // ✅ IDOR FIX: Проверяем, что группа принадлежит текущему репетитору
            if (!group.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            boolean hasSeats = groupService.hasAvailableSeats(groupId);
            return ResponseEntity.ok(Map.of("hasAvailableSeats", hasSeats));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Получить группы по курсу
    @GetMapping("/course/{courseId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getGroupsByCourse(@PathVariable Long courseId,
                                               @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            // Сервис возвращает группы, но мы должны убедиться, что курс принадлежит репетитору
            // Эта проверка делается внутри GroupService
            List<Group> groups = groupService.getGroupsByCourse(courseId);

            // ✅ IDOR FIX: Фильтруем только группы текущего репетитора
            groups = groups.stream()
                    .filter(g -> g.getTutor().getId().equals(currentUserId))
                    .toList();

            return ResponseEntity.ok(groups);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Удалить группу
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> deleteGroup(@PathVariable Long id,
                                         @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Group group = groupService.getGroupById(id);

            // ✅ IDOR FIX: Проверяем, что группа принадлежит текущему репетитору
            if (!group.getTutor().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            groupService.deleteGroup(id);
            return ResponseEntity.ok(Map.of("message", "Группа успешно удалена"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Получить группы по статусу
    @GetMapping("/tutor/{tutorId}/status/{status}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getGroupsByStatus(@PathVariable Long tutorId,
                                               @PathVariable String status,
                                               @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            // ✅ IDOR FIX: Проверяем, что репетитор запрашивает СВОИ группы
            if (!tutorId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            List<Group> groups = groupService.getGroupsByStatus(tutorId, status);
            return ResponseEntity.ok(groups);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Получить статистику по группам
    @GetMapping("/stats/{tutorId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getGroupStats(@PathVariable Long tutorId,
                                           @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            // ✅ IDOR FIX: Проверяем, что репетитор запрашивает СВОЮ статистику
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