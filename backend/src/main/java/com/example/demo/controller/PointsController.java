package com.example.demo.controller;

import com.example.demo.entity.PointsHistory;
import com.example.demo.entity.Student;
import com.example.demo.repository.StudentRepository;
import com.example.demo.service.PointsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/points")
public class PointsController {

    @Autowired
    private PointsService pointsService;

    @Autowired
    private StudentRepository studentRepository;

    /**
     * Баланс + ранг + прогресс до следующего ранга.
     */
    @GetMapping("/balance/{studentId}")
    public ResponseEntity<?> getBalance(@PathVariable Long studentId) {
        Student student = studentRepository.findById(studentId).orElse(null);
        if (student == null) return ResponseEntity.notFound().build();

        int balance = student.getPointsBalance() != null ? student.getPointsBalance() : 0;
        int total = student.getPointsTotal() != null ? student.getPointsTotal() : 0;

        PointsService.RankInfo rank = pointsService.getRank(total);

        // Прогресс до следующего ранга
        int progressPercent = 100;
        int pointsToNext = 0;
        if (rank.nextThreshold != null) {
            int span = rank.nextThreshold - rank.minPoints;
            int done = total - rank.minPoints;
            progressPercent = span > 0 ? (int) Math.round(done * 100.0 / span) : 100;
            pointsToNext = rank.nextThreshold - total;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("balance", balance);
        result.put("total", total);
        result.put("rank", rank);
        result.put("progressPercent", progressPercent);
        result.put("pointsToNext", pointsToNext);

        return ResponseEntity.ok(result);
    }

    /**
     * История начислений.
     */
    @GetMapping("/history/{studentId}")
    public ResponseEntity<List<PointsHistory>> getHistory(@PathVariable Long studentId) {
        return ResponseEntity.ok(pointsService.getHistory(studentId));
    }
}