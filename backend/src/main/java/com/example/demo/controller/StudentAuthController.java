package com.example.demo.controller;

import com.example.demo.entity.Student;
import com.example.demo.repository.StudentRepository;
import com.example.demo.config.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.dao.DataAccessException;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/student-auth")
@CrossOrigin(origins = "http://localhost:3000")
public class StudentAuthController {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String password = request.get("password");

            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email не может быть пустым"));
            }

            if (password == null || password.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Пароль не может быть пустым"));
            }

            List<Student> students = studentRepository.findByEmail(email.trim());

            if (students.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Ученик с таким email не найден"));
            }

            Student primaryStudent = students.get(0);

            // Проверка пароля
            if (primaryStudent.getPasswordHash() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Для этого ученика не установлен пароль. Обратитесь к репетитору."));
            }

            if (!passwordEncoder.matches(password, primaryStudent.getPasswordHash())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Неверный пароль"));
            }

            List<Long> allStudentIds = students.stream()
                    .map(Student::getId)
                    .collect(Collectors.toList());

            String token = jwtUtils.generateToken(primaryStudent.getEmail(), primaryStudent.getId(), "ROLE_STUDENT");

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("id", primaryStudent.getId());
            response.put("allIds", allStudentIds);
            response.put("fullName", primaryStudent.getFullName());
            response.put("email", primaryStudent.getEmail());
            response.put("role", "student");

            if (primaryStudent.getBirthday() != null) {
                response.put("birthday", primaryStudent.getBirthday().toString());
            }

            return ResponseEntity.ok(response);

        } catch (DataAccessException e) {
            return ResponseEntity.status(500).body(Map.of("error", "Ошибка базы данных: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Внутренняя ошибка сервера"));
        }
    }
}