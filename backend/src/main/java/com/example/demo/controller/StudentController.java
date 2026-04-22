// ========== backend/src/main/java/com/example/demo/controller/StudentController.java ==========
package com.example.demo.controller;

import com.example.demo.entity.Parent;
import com.example.demo.entity.InvitationToken;
import com.example.demo.entity.Student;
import com.example.demo.entity.Subscription;
import com.example.demo.entity.Tutor;
import com.example.demo.repository.InvitationTokenRepository;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.SubscriptionRepository;
import com.example.demo.service.EmailService;
import com.example.demo.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://72.56.238.224",
        "http://ed-space.ru",
        "https://ed-space.ru",
        "https://www.ed-space.ru"
}, allowCredentials = "true")
public class StudentController {

    @Autowired
    private StudentService studentService;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private InvitationTokenRepository invitationTokenRepository;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @PostMapping
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> createStudent(@RequestBody Map<String, Object> request,
                                           @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            String email = (String) request.get("email");
            Long tutorId = Long.parseLong(request.get("tutorId").toString());

            if (!tutorId.equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            BigDecimal ratePerLesson = null;
            if (request.get("ratePerLesson") != null && !request.get("ratePerLesson").toString().isEmpty()) {
                ratePerLesson = new BigDecimal(request.get("ratePerLesson").toString());
            }

            String paymentType = (String) request.get("paymentType");
            if (paymentType == null) {
                paymentType = "single";
            }

            String parentEmail = (String) request.get("parentEmail");

            List<Student> existingStudents = studentRepository.findByEmail(email);

            if (!existingStudents.isEmpty()) {
                Student existingStudent = existingStudents.get(0);
                Tutor tutor = studentService.getTutorById(tutorId);

                boolean alreadyHasTutor = existingStudent.getTutors().stream()
                        .anyMatch(t -> t.getId().equals(tutorId));

                if (!alreadyHasTutor) {
                    existingStudent.addTutor(tutor);
                }

                if (ratePerLesson != null) {
                    existingStudent.setRateForTutor(tutor, ratePerLesson);
                }

                studentRepository.save(existingStudent);

                sendInvitationToStudent(existingStudent, tutorId);

                if (parentEmail != null && !parentEmail.trim().isEmpty()) {
                    sendParentInvitation(existingStudent, tutorId, parentEmail);
                }

                return ResponseEntity.ok(studentToMap(existingStudent, tutorId, null));
            }

            Student student = studentService.addStudent(
                    (String) request.get("fullName"),
                    email,
                    ratePerLesson,
                    paymentType,
                    tutorId,
                    parentEmail
            );

            sendInvitationToStudent(student, tutorId);

            if (parentEmail != null && !parentEmail.trim().isEmpty()) {
                sendParentInvitation(student, tutorId, parentEmail);
            }

            return ResponseEntity.ok(studentToMap(student, tutorId, null));

        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/tutor/{tutorId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getStudentsByTutor(@PathVariable Long tutorId,
                                                @RequestAttribute(name = "userId", required = false) Long currentUserId,
                                                @RequestAttribute(name = "userRole", required = false) String userRole) {
        if (!"ROLE_TUTOR".equals(userRole)) {
            return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
        }
        if (!tutorId.equals(currentUserId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
        }
        try {
            List<Student> students = studentService.getStudentsByTutor(tutorId).stream()
                    .filter(s -> s.getArchived() == null || !s.getArchived())
                    .collect(Collectors.toList());

            List<Long> studentIds = students.stream().map(Student::getId).collect(Collectors.toList());
            List<Subscription> allSubscriptions = subscriptionRepository.findByStudentIdIn(studentIds);
            Map<Long, Subscription> subscriptionMap = new HashMap<>();
            for (Subscription sub : allSubscriptions) {
                Long studentId = sub.getStudent().getId();
                Subscription existing = subscriptionMap.get(studentId);
                if (existing == null || "ACTIVE".equalsIgnoreCase(sub.getStatus())) {
                    subscriptionMap.put(studentId, sub);
                } else if (!"ACTIVE".equalsIgnoreCase(existing.getStatus()) && "PENDING".equalsIgnoreCase(sub.getStatus())) {
                    subscriptionMap.put(studentId, sub);
                }
            }
            List<Map<String, Object>> result = students.stream()
                    .map(s -> studentToMap(s, tutorId, subscriptionMap.get(s.getId())))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/tutor/{tutorId}/archived")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getArchivedStudentsByTutor(@PathVariable Long tutorId,
                                                        @RequestAttribute(name = "userId", required = false) Long currentUserId,
                                                        @RequestAttribute(name = "userRole", required = false) String userRole) {
        if (!"ROLE_TUTOR".equals(userRole)) {
            return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
        }
        if (!tutorId.equals(currentUserId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
        }
        try {
            List<Student> archivedStudents = studentService.getStudentsByTutor(tutorId).stream()
                    .filter(s -> s.getArchived() != null && s.getArchived())
                    .collect(Collectors.toList());

            List<Long> studentIds = archivedStudents.stream().map(Student::getId).collect(Collectors.toList());
            List<Subscription> allSubscriptions = subscriptionRepository.findByStudentIdIn(studentIds);
            Map<Long, Subscription> subscriptionMap = new HashMap<>();
            for (Subscription sub : allSubscriptions) {
                Long studentId = sub.getStudent().getId();
                Subscription existing = subscriptionMap.get(studentId);
                if (existing == null || "ACTIVE".equalsIgnoreCase(sub.getStatus())) {
                    subscriptionMap.put(studentId, sub);
                } else if (!"ACTIVE".equalsIgnoreCase(existing.getStatus()) && "PENDING".equalsIgnoreCase(sub.getStatus())) {
                    subscriptionMap.put(studentId, sub);
                }
            }

            List<Map<String, Object>> result = archivedStudents.stream()
                    .map(s -> studentToMap(s, tutorId, subscriptionMap.get(s.getId())))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/parent/{parentId}")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<?> getStudentsByParent(@PathVariable Long parentId,
                                                 @RequestAttribute(name = "userId", required = false) Long currentUserId,
                                                 @RequestAttribute(name = "userRole", required = false) String userRole) {
        if (!"ROLE_PARENT".equals(userRole)) {
            return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
        }

        if (!parentId.equals(currentUserId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
        }

        try {
            List<Student> students = studentService.getStudentsByParent(parentId);

            List<Long> studentIds = students.stream().map(Student::getId).collect(Collectors.toList());
            List<Subscription> allSubscriptions = subscriptionRepository.findByStudentIdIn(studentIds);

            Map<Long, Subscription> subscriptionMap = new HashMap<>();
            for (Subscription sub : allSubscriptions) {
                Long studentId = sub.getStudent().getId();
                Subscription existing = subscriptionMap.get(studentId);
                if (existing == null || "ACTIVE".equalsIgnoreCase(sub.getStatus())) {
                    subscriptionMap.put(studentId, sub);
                }
            }

            List<Map<String, Object>> result = students.stream()
                    .map(s -> studentToMap(s, null, subscriptionMap.get(s.getId())))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT', 'PARENT')")
    public ResponseEntity<?> getStudentById(@PathVariable Long id,
                                            @RequestAttribute(name = "userId", required = false) Long currentUserId,
                                            @RequestAttribute(name = "userRole", required = false) String userRole) {
        try {
            Student student = studentService.getStudentById(id);

            if ("ROLE_TUTOR".equals(userRole)) {
                boolean hasTutor = student.getTutors().stream()
                        .anyMatch(t -> t.getId().equals(currentUserId));
                if (!hasTutor) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }
                Subscription sub = subscriptionRepository.findFirstByStudentIdOrderByIdDesc(id).orElse(null);
                return ResponseEntity.ok(studentToMap(student, currentUserId, sub));
            } else if ("ROLE_STUDENT".equals(userRole)) {
                if (!student.getId().equals(currentUserId)) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }
            } else if ("ROLE_PARENT".equals(userRole)) {
                if (student.getParent() == null || !student.getParent().getId().equals(currentUserId)) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }
            }

            return ResponseEntity.ok(studentToMap(student, null, null));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT')")
    public ResponseEntity<?> updateStudent(@PathVariable Long id,
                                           @RequestBody Map<String, Object> request,
                                           @RequestAttribute(name = "userId", required = false) Long currentUserId,
                                           @RequestAttribute(name = "userRole", required = false) String userRole) {
        try {
            Student student = studentService.getStudentById(id);

            if ("ROLE_TUTOR".equals(userRole)) {
                boolean hasTutor = student.getTutors().stream()
                        .anyMatch(t -> t.getId().equals(currentUserId));
                if (!hasTutor) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }
            } else if ("ROLE_STUDENT".equals(userRole)) {
                if (!student.getId().equals(currentUserId)) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }
            }

            if (request.get("fullName") != null) {
                student.setFullName((String) request.get("fullName"));
            }
            if (request.get("phone") != null) {
                student.setPhone((String) request.get("phone"));
            }
            if ("ROLE_TUTOR".equals(userRole) && request.get("email") != null) {
                student.setEmail((String) request.get("email"));
            }
            if ("ROLE_TUTOR".equals(userRole) && request.get("paymentType") != null) {
                student.setPaymentType((String) request.get("paymentType"));
            }

            if ("ROLE_TUTOR".equals(userRole) && request.containsKey("parentEmail")) {
                String newParentEmail = (String) request.get("parentEmail");
                String oldParentEmail = student.getParent() != null ? student.getParent().getEmail() : null;

                if (newParentEmail != null && !newParentEmail.trim().isEmpty()
                        && (oldParentEmail == null || !oldParentEmail.equals(newParentEmail))) {

                    Parent parent = studentService.findOrCreateParent(newParentEmail, student.getFullName());
                    student.setParent(parent);
                    student.setParentName(parent.getFullName());
                    student.setParentPhone(parent.getPhone());

                    sendParentInvitation(student, currentUserId, newParentEmail);
                }
            }

            if ("ROLE_TUTOR".equals(userRole) && request.get("ratePerLesson") != null) {
                String rateStr = request.get("ratePerLesson").toString();
                if (!rateStr.isEmpty()) {
                    BigDecimal rate = new BigDecimal(rateStr);
                    Tutor tutor = studentService.getTutorById(currentUserId);
                    student.setRateForTutor(tutor, rate);
                }
            }
            if (request.containsKey("archived")) {
                student.setArchived((Boolean) request.get("archived"));
            }

            studentRepository.save(student);
            Subscription sub = subscriptionRepository.findFirstByStudentIdOrderByIdDesc(id).orElse(null);
            return ResponseEntity.ok(studentToMap(student, currentUserId, sub));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> deleteStudent(@PathVariable Long id,
                                           @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Student student = studentService.getStudentById(id);

            boolean hasTutor = student.getTutors().stream()
                    .anyMatch(t -> t.getId().equals(currentUserId));
            if (!hasTutor) {
                return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
            }

            if (student.getTutors().size() <= 1) {
                studentService.deleteStudent(id);
            } else {
                studentService.removeTutorFromStudent(id, currentUserId);
            }

            return ResponseEntity.ok(Map.of("message", "Ученик отвязан от репетитора"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> searchStudents(@RequestParam String name,
                                            @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            List<Student> students = studentService.searchStudentsByName(name);
            students = students.stream()
                    .filter(s -> s.getTutors().stream().anyMatch(t -> t.getId().equals(currentUserId)))
                    .toList();

            List<Long> studentIds = students.stream().map(Student::getId).collect(Collectors.toList());
            List<Subscription> allSubscriptions = subscriptionRepository.findByStudentIdIn(studentIds);
            Map<Long, Subscription> subscriptionMap = new HashMap<>();
            for (Subscription sub : allSubscriptions) {
                Long studentId = sub.getStudent().getId();
                Subscription existing = subscriptionMap.get(studentId);
                if (existing == null || "ACTIVE".equalsIgnoreCase(sub.getStatus())) {
                    subscriptionMap.put(studentId, sub);
                }
            }

            List<Map<String, Object>> result = students.stream()
                    .map(s -> studentToMap(s, currentUserId, subscriptionMap.get(s.getId())))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/count")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getStudentsCount(@RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            long count = studentService.getStudentsCountByTutor(currentUserId);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/search-by-email")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> searchStudentByEmail(@RequestParam String email,
                                                  @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            List<Student> students = studentRepository.findByEmail(email);

            if (students.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Student student = students.get(0);
            Subscription sub = subscriptionRepository.findFirstByStudentIdOrderByIdDesc(student.getId()).orElse(null);
            return ResponseEntity.ok(studentToMap(student, currentUserId, sub));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================

    private Map<String, Object> studentToMap(Student student, Long tutorId, Subscription subscription) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", student.getId());
        map.put("fullName", student.getFullName());
        map.put("email", student.getEmail());
        map.put("phone", student.getPhone());
        map.put("paymentType", student.getPaymentType());
        map.put("missedLessons", student.getMissedLessons() != null ? student.getMissedLessons() : 0);
        map.put("archived", student.getArchived() != null ? student.getArchived() : false);

        if (tutorId != null) {
            map.put("ratePerLesson", student.getRateForTutor(tutorId));
        }

        if (subscription != null) {
            Map<String, Object> subMap = new HashMap<>();
            subMap.put("id", subscription.getId());
            subMap.put("totalLessons", subscription.getLessonsCount());
            subMap.put("usedLessons", subscription.getLessonsUsed() != null ? subscription.getLessonsUsed() : 0);
            subMap.put("debtLessons", subscription.getDebtLessons() != null ? subscription.getDebtLessons() : 0);
            subMap.put("status", subscription.getStatus());
            map.put("subscription", subMap);
        }

        // ========== ИСПРАВЛЕНИЕ B3.2: Имя родителя ==========
        if (student.getParent() != null) {
            String parentFullName = student.getParent().getFullName();
            // Если имя родителя начинается с "Родитель " — значит, он не зарегистрирован
            if (parentFullName != null && parentFullName.startsWith("Родитель ")) {
                map.put("parent", null);
                map.put("parentEmail", student.getParent().getEmail());
                map.put("parentName", "Не указано");
            } else {
                Map<String, Object> parentMap = new HashMap<>();
                parentMap.put("id", student.getParent().getId());
                parentMap.put("fullName", parentFullName);
                parentMap.put("email", student.getParent().getEmail());
                parentMap.put("phone", student.getParent().getPhone());
                map.put("parent", parentMap);
                map.put("parentEmail", student.getParent().getEmail());
                map.put("parentName", parentFullName);
            }
        } else {
            map.put("parent", null);
            map.put("parentEmail", null);
            map.put("parentName", null);
        }
        // =====================================================

        List<Map<String, Object>> tutors = student.getTutors().stream()
                .map(t -> {
                    Map<String, Object> tm = new HashMap<>();
                    tm.put("id", t.getId());
                    tm.put("fullName", t.getFullName());
                    tm.put("email", t.getEmail());
                    return tm;
                })
                .collect(Collectors.toList());
        map.put("tutors", tutors);

        return map;
    }

    private void sendInvitationToStudent(Student student, Long tutorId) {
        try {
            Tutor tutor = studentService.getTutorById(tutorId);

            InvitationToken token = new InvitationToken();
            token.setEmail(student.getEmail());
            token.setToken(UUID.randomUUID().toString());
            token.setStudentId(student.getId());
            token.setTutorId(tutorId);
            token.setRatePerLesson(student.getRateForTutor(tutorId));
            token.setPaymentType(student.getPaymentType());
            token.setUserType("STUDENT");
            token.setExpiresAt(java.time.LocalDateTime.now().plusDays(7));

            invitationTokenRepository.save(token);

            emailService.sendStudentInvitation(token, student.getFullName(), tutor.getFullName());

            System.out.println("📧 Приглашение отправлено ученику: " + student.getEmail());

        } catch (Exception e) {
            System.err.println("❌ Ошибка отправки приглашения ученику " + student.getEmail() + ": " + e.getMessage());
        }
    }

    private void sendParentInvitation(Student student, Long tutorId, String parentEmail) {
        try {
            Tutor tutor = studentService.getTutorById(tutorId);

            InvitationToken token = new InvitationToken();
            token.setEmail(parentEmail);
            token.setToken(UUID.randomUUID().toString());
            token.setStudentId(student.getId());
            token.setTutorId(tutorId);
            token.setUserType("PARENT");
            token.setExpiresAt(java.time.LocalDateTime.now().plusDays(7));

            invitationTokenRepository.save(token);

            emailService.sendParentInvitation(token, student.getFullName(), tutor.getFullName());

            System.out.println("📧 Приглашение отправлено родителю: " + parentEmail);

        } catch (Exception e) {
            System.err.println("❌ Ошибка отправки приглашения родителю " + parentEmail + ": " + e.getMessage());
        }
    }
}