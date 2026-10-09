package com.example.demo.controller;

import com.example.demo.entity.Tournament;
import com.example.demo.entity.TournamentParticipant;
import com.example.demo.service.TournamentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/tournaments")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://72.56.238.224",
        "http://ed-space.ru",
        "https://ed-space.ru",
        "https://www.ed-space.ru"
}, allowCredentials = "true")
@RequiredArgsConstructor
public class TournamentController {

    private final TournamentService tournamentService;

    // ========== УЧЕНИК ==========

    /**
     * Активный турнир — для страницы ученика.
     * Возвращает турнир и список только APPROVED участников.
     */
    @GetMapping("/active")
    public ResponseEntity<?> getActiveTournament() {
        try {
            Tournament active = tournamentService.getActiveTournament();
            List<TournamentParticipant> participants = active == null
                    ? List.of()
                    : tournamentService.getParticipants(active.getId())
                      .stream()
                      .filter(p -> "APPROVED".equals(p.getStatus()))
                      .toList();

            java.util.Map<String, Object> result = new java.util.HashMap<>();
            result.put("tournament", active);
            result.put("participants", participants);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Ошибка получения активного турнира: ", e);
            return ResponseEntity.status(500).body(java.util.Map.of("error", "Internal error"));
        }
    }

    /**
     * Записаться на турнир.
     */
    @PostMapping("/{tournamentId}/join")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> joinTournament(@PathVariable Long tournamentId,
                                            @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            if (currentUserId == null) {
                return ResponseEntity.status(403).body(Map.of("error", "Не авторизован"));
            }
            TournamentParticipant p = tournamentService.joinTournament(tournamentId, currentUserId);
            return ResponseEntity.ok(p);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Статус заявки ученика — чтобы показать «Ты записан / Заявка на рассмотрении».
     */
    @GetMapping("/{tournamentId}/my-status")
    @PreAuthorize("hasAnyRole('STUDENT', 'TUTOR')")
    public ResponseEntity<?> getMyStatus(@PathVariable Long tournamentId,
                                         @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            return tournamentService.getParticipants(tournamentId)
                    .stream()
                    .filter(p -> p.getStudent().getId().equals(currentUserId))
                    .findFirst()
                    .map(p -> ResponseEntity.ok(Map.of(
                            "status", p.getStatus(),
                            "participant", p
                    )))
                    .orElseGet(() -> ResponseEntity.ok(Map.of("status", "NOT_JOINED")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========== РЕПЕТИТОР ==========

    /**
     * Все турниры (для страницы управления).
     */
    @GetMapping("/all")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getAllTournaments() {
        try {
            return ResponseEntity.ok(tournamentService.getAllTournaments());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Один турнир с участниками (включая PENDING — для репетитора).
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getTournament(@PathVariable Long id) {
        try {
            Tournament t = tournamentService.getTournamentById(id);
            List<TournamentParticipant> participants = tournamentService.getParticipants(id);
            return ResponseEntity.ok(Map.of(
                    "tournament", t,
                    "participants", participants
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Создать турнир.
     */
    @PostMapping
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> createTournament(@RequestBody Map<String, Object> body,
                                              @RequestAttribute(name = "userId", required = false) Long currentUserId) {
        try {
            Tournament t = new Tournament();
            t.setName((String) body.get("name"));
            t.setStartDate(LocalDate.parse((String) body.get("startDate")));
            t.setEndDate(LocalDate.parse((String) body.get("endDate")));
            t.setStatus("ACTIVE");
            t.setCreatedBy(currentUserId);
            return ResponseEntity.ok(tournamentService.createTournament(t));
        } catch (Exception e) {
            log.error("Ошибка создания турнира: ", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Обновить турнир (название, статус).
     */
    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> updateTournament(@PathVariable Long id,
                                              @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(tournamentService.updateTournament(id, body));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Удалить турнир.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> deleteTournament(@PathVariable Long id) {
        try {
            tournamentService.deleteTournament(id);
            return ResponseEntity.ok(Map.of("message", "Турнир удалён"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Обновить баллы участника (baseScore, round1-4Score).
     * После сохранения автоматически пересчитывается прогресс и места.
     */
    @PatchMapping("/participants/{participantId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> updateParticipantScores(@PathVariable Long participantId,
                                                     @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(tournamentService.updateParticipantScores(participantId, body));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Допустить или отклонить участника.
     */
    @PatchMapping("/participants/{participantId}/approve")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> approveParticipant(@PathVariable Long participantId,
                                                @RequestBody Map<String, Object> body) {
        try {
            boolean approved = Boolean.TRUE.equals(body.get("approved"));
            return ResponseEntity.ok(tournamentService.approveParticipant(participantId, approved));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Удалить участника.
     */
    @DeleteMapping("/participants/{participantId}")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> removeParticipant(@PathVariable Long participantId) {
        try {
            tournamentService.removeParticipant(participantId);
            return ResponseEntity.ok(Map.of("message", "Участник удалён"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}