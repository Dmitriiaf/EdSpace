// ========== backend/src/main/java/com/example/demo/controller/StudentController.java ==========
package com.example.demo.controller;
import com.example.demo.entity.Parent;

import com.example.demo.entity.InvitationToken;
import com.example.demo.entity.Student;
import com.example.demo.entity.Tutor;
import com.example.demo.repository.InvitationTokenRepository;
import com.example.demo.repository.StudentRepository;
import com.example.demo.service.EmailService;
import com.example.demo.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://72.56.238.224",
        "http://ed-space.ru"
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

    @PostMapping
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> createStudent(@RequestBody Map<String, Object> request,
                                           @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            String email = (String) request.get("email");
            Long tutorId = Long.parseLong(request.get("tutorId").toString());

            // IDOR FIX: Проверяем, что репетитор создаёт ученика для себя
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

                // ✅ Отправляем приглашение существующему ученику
                sendInvitationToStudent(existingStudent, tutorId);

                // ✅ Отправляем приглашение родителю, если указан email
                if (parentEmail != null && !parentEmail.trim().isEmpty()) {
                    sendParentInvitation(existingStudent, tutorId, parentEmail);
                }

                return ResponseEntity.ok(existingStudent);
            }

            Student student = studentService.addStudent(
                    (String) request.get("fullName"),
                    email,
                    ratePerLesson,
                    paymentType,
                    tutorId,
                    parentEmail
            );

            // ✅ Отправляем приглашение новому ученику
            sendInvitationToStudent(student, tutorId);

            // ✅ Отправляем приглашение родителю, если указан email
            if (parentEmail != null && !parentEmail.trim().isEmpty()) {
                sendParentInvitation(student, tutorId, parentEmail);
            }

            return ResponseEntity.ok(student);

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
        // IDOR FIX: Проверяем роль и ID
        if (!"ROLE_TUTOR".equals(userRole)) {
            return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
        }

        if (!tutorId.equals(currentUserId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
        }

        try {
            List<Student> students = studentService.getStudentsByTutor(tutorId);
            return ResponseEntity.ok(students);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/parent/{parentId}")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<?> getStudentsByParent(@PathVariable Long parentId,
                                                 @RequestAttribute(name = "userId", required = false) Long currentUserId,
                                                 @RequestAttribute(name = "userRole", required = false) String userRole) {
        // IDOR FIX: Проверяем роль и ID
        if (!"ROLE_PARENT".equals(userRole)) {
            return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
        }

        if (!parentId.equals(currentUserId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
        }

        try {
            List<Student> students = studentService.getStudentsByParent(parentId);
            return ResponseEntity.ok(students);
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

            // IDOR FIX: Проверяем права доступа в зависимости от роли
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
            } else if ("ROLE_PARENT".equals(userRole)) {
                if (student.getParent() == null || !student.getParent().getId().equals(currentUserId)) {
                    return ResponseEntity.status(403).body(Map.of("error", "Доступ запрещён"));
                }
            }

            return ResponseEntity.ok(student);
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

            // IDOR FIX: Проверяем права доступа
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

            // ✅ Запоминаем старый parentEmail
            String oldParentEmail = student.getParent() != null ? student.getParent().getEmail() : null;

            // Обновляем базовые поля
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

            // ✅ Обработка parentEmail (только для репетитора)
            if ("ROLE_TUTOR".equals(userRole) && request.containsKey("parentEmail")) {
                String newParentEmail = (String) request.get("parentEmail");

                // Если указан новый email родителя и он отличается от старого
                if (newParentEmail != null && !newParentEmail.trim().isEmpty()
                        && (oldParentEmail == null || !oldParentEmail.equals(newParentEmail))) {

                    // ✅ СОЗДАЁМ ИЛИ ОБНОВЛЯЕМ РОДИТЕЛЯ
                    Parent parent = studentService.findOrCreateParent(newParentEmail, student.getFullName());
                    student.setParent(parent);
                    student.setParentName(parent.getFullName());
                    student.setParentPhone(parent.getPhone());

                    // Отправляем приглашение родителю
                    sendParentInvitation(student, currentUserId, newParentEmail);
                }
            }

            // Ставка обновляется только репетитором
            if ("ROLE_TUTOR".equals(userRole) && request.get("ratePerLesson") != null) {
                String rateStr = request.get("ratePerLesson").toString();
                if (!rateStr.isEmpty()) {
                    BigDecimal rate = new BigDecimal(rateStr);
                    Tutor tutor = studentService.getTutorById(currentUserId);
                    student.setRateForTutor(tutor, rate);
                }
            }

            studentRepository.save(student);
            return ResponseEntity.ok(student);

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

            // IDOR FIX: Проверяем, что ученик принадлежит текущему репетитору
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
            // IDOR FIX: Фильтруем только учеников текущего репетитора
            students = students.stream()
                    .filter(s -> s.getTutors().stream().anyMatch(t -> t.getId().equals(currentUserId)))
                    .toList();
            return ResponseEntity.ok(students);
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
            return ResponseEntity.ok(student);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ Отправка приглашения ученику
    private void sendInvitationToStudent(Student student, Long tutorId) {
        try {
            Tutor tutor = studentService.getTutorById(tutorId);

            // Создать токен приглашения
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

            // Отправить письмо
            emailService.sendStudentInvitation(token, student.getFullName(), tutor.getFullName());

            System.out.println("📧 Приглашение отправлено ученику: " + student.getEmail());

        } catch (Exception e) {
            System.err.println("❌ Ошибка отправки приглашения ученику " + student.getEmail() + ": " + e.getMessage());
        }
    }

    // ✅ НОВЫЙ МЕТОД: Отправка приглашения родителю
    private void sendParentInvitation(Student student, Long tutorId, String parentEmail) {
        try {
            Tutor tutor = studentService.getTutorById(tutorId);

            // Создать токен приглашения для родителя
            InvitationToken token = new InvitationToken();
            token.setEmail(parentEmail);
            token.setToken(UUID.randomUUID().toString());
            token.setStudentId(student.getId());
            token.setTutorId(tutorId);
            token.setUserType("PARENT");
            token.setExpiresAt(java.time.LocalDateTime.now().plusDays(7));

            invitationTokenRepository.save(token);

            // Отправить письмо родителю
            emailService.sendParentInvitation(token, student.getFullName(), tutor.getFullName());

            System.out.println("📧 Приглашение отправлено родителю: " + parentEmail);

        } catch (Exception e) {
            System.err.println("❌ Ошибка отправки приглашения родителю " + parentEmail + ": " + e.getMessage());
        }
    }
}