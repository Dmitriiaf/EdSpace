package com.example.demo.controller;

import com.example.demo.entity.Tutor;
import com.example.demo.service.TutorService;
import com.example.demo.config.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class AuthController {

    @Autowired
    private TutorService tutorService;

    @Autowired
    private JwtUtils jwtUtils;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        try {
            Tutor tutor = tutorService.registerTutor(
                    request.get("email"),
                    request.get("password"),
                    request.get("fullName"),
                    request.get("phone")
            );

            String token = jwtUtils.generateToken(tutor.getEmail(), tutor.getId(), "ROLE_TUTOR");

            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "id", tutor.getId(),
                    "email", tutor.getEmail(),
                    "fullName", tutor.getFullName(),
                    "role", "tutor"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        try {
            Tutor tutor = tutorService.login(
                    request.get("email"),
                    request.get("password")
            );

            String token = jwtUtils.generateToken(tutor.getEmail(), tutor.getId(), "ROLE_TUTOR");

            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "id", tutor.getId(),
                    "email", tutor.getEmail(),
                    "fullName", tutor.getFullName(),
                    "role", "tutor"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}