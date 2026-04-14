package com.example.demo.controller;

import com.example.demo.entity.Parent;
import com.example.demo.entity.Student;
import com.example.demo.repository.ParentRepository;
import com.example.demo.repository.StudentRepository;
import com.example.demo.config.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/parent-auth")
@CrossOrigin(origins = "http://localhost:3000")
public class ParentAuthController {

    @Autowired
    private ParentRepository parentRepository;

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

            Optional<Parent> parentOpt = parentRepository.findByEmail(email);

            if (parentOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Родитель не найден"));
            }

            Parent parent = parentOpt.get();

            if (parent.getPasswordHash() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Для этого родителя не установлен пароль. Обратитесь к репетитору."));
            }

            if (!passwordEncoder.matches(password, parent.getPasswordHash())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Неверный пароль"));
            }

            List<Student> allChildren = studentRepository.findByParentId(parent.getId());

            Map<String, List<Student>> groupedChildren = new HashMap<>();
            for (Student student : allChildren) {
                String key = student.getEmail() != null && !student.getEmail().isEmpty()
                        ? student.getEmail()
                        : student.getFullName();

                if (!groupedChildren.containsKey(key)) {
                    groupedChildren.put(key, new ArrayList<>());
                }
                groupedChildren.get(key).add(student);
            }

            List<Map<String, Object>> childrenForFrontend = new ArrayList<>();

            for (Map.Entry<String, List<Student>> entry : groupedChildren.entrySet()) {
                List<Student> students = entry.getValue();
                Student firstStudent = students.get(0);

                List<Long> allIds = students.stream()
                        .map(Student::getId)
                        .collect(Collectors.toList());

                Map<String, Object> childMap = new HashMap<>();
                childMap.put("id", firstStudent.getId());
                childMap.put("allIds", allIds);
                childMap.put("fullName", firstStudent.getFullName());
                childMap.put("email", firstStudent.getEmail());

                childrenForFrontend.add(childMap);
            }

            String token = jwtUtils.generateToken(parent.getEmail(), parent.getId(), "ROLE_PARENT");

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("id", parent.getId());
            response.put("fullName", parent.getFullName());
            response.put("email", parent.getEmail());
            response.put("role", "parent");
            response.put("children", childrenForFrontend);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Внутренняя ошибка сервера"));
        }
    }
}