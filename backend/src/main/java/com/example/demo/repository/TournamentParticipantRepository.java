package com.example.demo.repository;

import com.example.demo.entity.TournamentParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TournamentParticipantRepository extends JpaRepository<TournamentParticipant, Long> {

    List<TournamentParticipant> findByTournamentId(Long tournamentId);

    List<TournamentParticipant> findByTournamentIdAndStatus(Long tournamentId, String status);

    Optional<TournamentParticipant> findByTournamentIdAndStudentId(Long tournamentId, Long studentId);

    List<TournamentParticipant> findByStudentId(Long studentId);

    void deleteByTournamentIdAndStudentId(Long tournamentId, Long studentId);
}