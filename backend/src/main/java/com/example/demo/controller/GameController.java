package com.example.demo.controller;

import com.example.demo.entity.GameScore;
import com.example.demo.entity.Student;
import com.example.demo.repository.GameScoreRepository;
import com.example.demo.repository.StudentRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/games")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://ed-space.ru",
        "https://ed-space.ru",
        "https://www.ed-space.ru"
}, allowCredentials = "true")
public class GameController {

    @Autowired
    private GameScoreRepository gameScoreRepository;

    @Autowired
    private StudentRepository studentRepository;

    // ========== СОХРАНИТЬ РЕКОРД ==========
    @PostMapping("/score")
    @PreAuthorize("hasAnyRole('STUDENT', 'TUTOR', 'SCHOOL_ADMIN')")
    public ResponseEntity<?> saveScore(@RequestBody Map<String, Object> body,
                                       @RequestAttribute(name = "userId", required = false) Long currentUserId,
                                       @RequestAttribute(name = "userRole", required = false) String userRole) {
        try {
            if (!"ROLE_STUDENT".equals(userRole)) {
                return ResponseEntity.ok(Map.of("saved", false, "message", "Только для учеников"));
            }

            String game = body.get("game") != null ? body.get("game").toString() : "flappy";
            int score = body.get("score") != null ? Integer.parseInt(body.get("score").toString()) : 0;

            Student student = studentRepository.findById(currentUserId)
                    .orElseThrow(() -> new RuntimeException("Ученик не найден"));

            GameScore existing = gameScoreRepository
                    .findByStudentIdAndGame(currentUserId, game)
                    .orElse(null);

            boolean isRecord = false;

            if (existing == null) {
                GameScore gs = new GameScore(currentUserId, null, game, score);
                gameScoreRepository.save(gs);
                isRecord = true;
            } else if (score > existing.getHighScore()) {
                existing.setHighScore(score);
                existing.setUpdatedAt(LocalDateTime.now());
                if (student.getTutors() != null && !student.getTutors().isEmpty()) {
                    existing.setTutorId(student.getTutors().get(0).getId());
                }
                gameScoreRepository.save(existing);
                isRecord = true;
            }

            return ResponseEntity.ok(Map.of(
                    "saved", true,
                    "isRecord", isRecord,
                    "highScore", isRecord ? score : existing.getHighScore()
            ));
        } catch (Exception e) {
            log.error("Ошибка сохранения рекорда: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== ТОП ВСЕХ УЧЕНИКОВ ==========
    @GetMapping("/leaderboard")
    @PreAuthorize("hasAnyRole('STUDENT', 'TUTOR', 'SCHOOL_ADMIN', 'PARENT')")
    public ResponseEntity<?> getLeaderboard(@RequestParam(defaultValue = "flappy") String game) {
        try {
            List<GameScore> scores = gameScoreRepository.findByGameOrderByHighScoreDesc(game);

            List<Map<String, Object>> result = new ArrayList<>();
            int place = 0;
            for (GameScore gs : scores) {
                place++;
                Student s = studentRepository.findById(gs.getStudentId()).orElse(null);
                if (s == null) continue;

                Map<String, Object> item = new HashMap<>();
                item.put("place", place);
                item.put("studentId", s.getId());
                item.put("studentName", s.getFullName());
                item.put("highScore", gs.getHighScore());
                item.put("updatedAt", gs.getUpdatedAt() != null ? gs.getUpdatedAt().toString() : "");
                result.add(item);
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Ошибка загрузки лидерборда: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== МОЙ РЕКОРД + МЕСТО ==========
    @GetMapping("/my-score")
    @PreAuthorize("hasAnyRole('STUDENT', 'TUTOR', 'SCHOOL_ADMIN')")
    public ResponseEntity<?> getMyScore(@RequestParam(defaultValue = "flappy") String game,
                                        @RequestAttribute(name = "userId", required = false) Long currentUserId,
                                        @RequestAttribute(name = "userRole", required = false) String userRole) {
        try {
            if (!"ROLE_STUDENT".equals(userRole)) {
                return ResponseEntity.ok(Map.of(
                        "highScore", 0,
                        "place", null,
                        "totalPlayers", 0
                ));
            }

            GameScore myScore = gameScoreRepository
                    .findByStudentIdAndGame(currentUserId, game)
                    .orElse(null);

            List<GameScore> all = gameScoreRepository.findByGameOrderByHighScoreDesc(game);

            Integer myPlace = null;
            int place = 0;
            for (GameScore gs : all) {
                place++;
                if (gs.getStudentId().equals(currentUserId)) {
                    myPlace = place;
                    break;
                }
            }

            return ResponseEntity.ok(Map.of(
                    "highScore", myScore != null ? myScore.getHighScore() : 0,
                    "place", myPlace,
                    "totalPlayers", all.size()
            ));
        } catch (Exception e) {
            log.error("Ошибка загрузки личного рекорда: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}