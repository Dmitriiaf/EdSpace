package com.example.demo.controller;

import com.example.demo.entity.Parent;
import com.example.demo.repository.ParentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/parents")
@CrossOrigin(origins = "http://localhost:3000")
public class ParentController {

    @Autowired
    private ParentRepository parentRepository;

    @PostMapping
    public ResponseEntity<?> createParent(@RequestBody Map<String, String> request) {
        try {
            Parent parent = new Parent(
                    request.get("fullName"),
                    request.get("email"),
                    request.get("phone")
            );

            Parent savedParent = parentRepository.save(parent);
            return ResponseEntity.ok(savedParent);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getParent(@PathVariable Long id) {
        return parentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}