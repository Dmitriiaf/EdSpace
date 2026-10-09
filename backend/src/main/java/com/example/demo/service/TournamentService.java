package com.example.demo.service;

import com.example.demo.entity.Student;
import com.example.demo.entity.Tournament;
import com.example.demo.entity.TournamentParticipant;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.TournamentParticipantRepository;
import com.example.demo.repository.TournamentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TournamentService {

    private final TournamentRepository tournamentRepository;
    private final TournamentParticipantRepository participantRepository;
    private final StudentRepository studentRepository;

    // ========== ТУРНИРЫ ==========

    public List<Tournament> getAllTournaments() {
        return tournamentRepository.findAllByOrderByStartDateDesc();
    }

    public Tournament getActiveTournament() {
        return tournamentRepository.findFirstByStatusOrderByStartDateDesc("ACTIVE").orElse(null);
    }

    public Tournament getTournamentById(Long id) {
        return tournamentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Турнир не найден"));
    }

    @Transactional
    public Tournament createTournament(Tournament tournament) {
        if (tournament.getStatus() == null || tournament.getStatus().isEmpty()) {
            tournament.setStatus("ACTIVE");
        }
        return tournamentRepository.save(tournament);
    }

    @Transactional
    public Tournament updateTournament(Long id, Map<String, Object> updates) {
        Tournament t = getTournamentById(id);
        if (updates.get("name") != null) t.setName((String) updates.get("name"));
        if (updates.get("status") != null) t.setStatus((String) updates.get("status"));
        return tournamentRepository.save(t);
    }

    @Transactional
    public void deleteTournament(Long id) {
        tournamentRepository.deleteById(id);
    }

    // ========== УЧАСТНИКИ ==========

    public List<TournamentParticipant> getParticipants(Long tournamentId) {
        List<TournamentParticipant> list = participantRepository.findByTournamentId(tournamentId);
        // Сортируем по месту (пустые — в конец)
        list.sort(Comparator.comparing(
                p -> p.getPlace() == null ? Integer.MAX_VALUE : p.getPlace()
        ));
        return list;
    }

    @Transactional
    public TournamentParticipant joinTournament(Long tournamentId, Long studentId) {
        Tournament t = getTournamentById(tournamentId);
        if (!"ACTIVE".equals(t.getStatus())) {
            throw new RuntimeException("Турнир уже завершён или неактивен");
        }

        // Проверяем, не записан ли уже
        participantRepository.findByTournamentIdAndStudentId(tournamentId, studentId)
                .ifPresent(p -> {
                    throw new RuntimeException("Ты уже записан в этот турнир");
                });

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Ученик не найден"));

        TournamentParticipant p = new TournamentParticipant();
        p.setTournament(t);
        p.setStudent(student);
        p.setStatus("PENDING");
        return participantRepository.save(p);
    }

    @Transactional
    public TournamentParticipant approveParticipant(Long participantId, boolean approved) {
        TournamentParticipant p = participantRepository.findById(participantId)
                .orElseThrow(() -> new RuntimeException("Участник не найден"));
        p.setStatus(approved ? "APPROVED" : "REJECTED");
        return participantRepository.save(p);
    }

    @Transactional
    public void removeParticipant(Long participantId) {
        participantRepository.deleteById(participantId);
    }

    // ========== ОБНОВЛЕНИЕ БАЛЛОВ И ПЕРЕСЧЁТ ==========

    @Transactional
    public TournamentParticipant updateParticipantScores(Long participantId, Map<String, Object> scores) {
        TournamentParticipant p = participantRepository.findById(participantId)
                .orElseThrow(() -> new RuntimeException("Участник не найден"));

        if (scores.containsKey("baseScore")) {
            p.setBaseScore(parseInt(scores.get("baseScore")));
        }
        if (scores.containsKey("round1Score")) {
            p.setRound1Score(parseInt(scores.get("round1Score")));
        }
        if (scores.containsKey("round2Score")) {
            p.setRound2Score(parseInt(scores.get("round2Score")));
        }
        if (scores.containsKey("round3Score")) {
            p.setRound3Score(parseInt(scores.get("round3Score")));
        }
        if (scores.containsKey("round4Score")) {
            p.setRound4Score(parseInt(scores.get("round4Score")));
        }

        recalculateProgress(p);
        p = participantRepository.save(p);

        // После сохранения — пересчитываем места у всех участников
        recalculatePlaces(p.getTournament().getId());

        return participantRepository.findById(p.getId()).orElse(p);
    }

    /**
     * Нормализованная формула прогресса:
     * прогресс_раунда = (балл − база) / (100 − база)
     * average_progress = среднее по всем заполненным раундам
     */
    private void recalculateProgress(TournamentParticipant p) {
        Integer base = p.getBaseScore();
        if (base == null) {
            p.setAverageProgress(null);
            return;
        }
        // Защита от деления на 0 и от базы >= 100
        double baseD = Math.min(base, 99);

        Integer[] rounds = {
                p.getRound1Score(), p.getRound2Score(),
                p.getRound3Score(), p.getRound4Score()
        };

        double sum = 0;
        int count = 0;
        for (Integer r : rounds) {
            if (r != null) {
                double progress = (r - baseD) / (100.0 - baseD);
                sum += progress;
                count++;
            }
        }

        if (count == 0) {
            p.setAverageProgress(null);
            return;
        }

        double avg = sum / count;
        p.setAverageProgress(BigDecimal.valueOf(avg).setScale(4, RoundingMode.HALF_UP));
    }

    /**
     * Сортирует всех участников турнира по average_progress и расставляет места.
     * Участники без прогресса — без места.
     */
    @Transactional
    public void recalculatePlaces(Long tournamentId) {
        List<TournamentParticipant> participants = participantRepository.findByTournamentId(tournamentId);

        // Сортируем: те, у кого есть прогресс — по убыванию; без прогресса — в конце
        participants.sort((a, b) -> {
            if (a.getAverageProgress() == null && b.getAverageProgress() == null) return 0;
            if (a.getAverageProgress() == null) return 1;
            if (b.getAverageProgress() == null) return -1;
            return b.getAverageProgress().compareTo(a.getAverageProgress());
        });

        int place = 1;
        for (TournamentParticipant p : participants) {
            if (p.getAverageProgress() != null && "APPROVED".equals(p.getStatus())) {
                p.setPlace(place++);
            } else {
                p.setPlace(null);
            }
        }
        participantRepository.saveAll(participants);
    }

    private Integer parseInt(Object val) {
        if (val == null) return null;
        if (val instanceof Number) return ((Number) val).intValue();
        String s = val.toString().trim();
        if (s.isEmpty() || s.equals("null")) return null;
        try {
            return Integer.parseInt(s);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}