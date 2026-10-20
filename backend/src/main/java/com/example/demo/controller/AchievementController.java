package com.example.demo.controller;

import com.example.demo.entity.StudentAchievement;
import com.example.demo.service.AchievementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/achievements")
public class AchievementController {

    @Autowired
    private AchievementService achievementService;

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<StudentAchievement>> getStudentAchievements(@PathVariable Long studentId) {
        return ResponseEntity.ok(achievementService.getStudentAchievements(studentId));
    }
}