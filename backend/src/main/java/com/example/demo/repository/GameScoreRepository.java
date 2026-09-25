package com.example.demo.repository;

import com.example.demo.entity.GameScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GameScoreRepository extends JpaRepository<GameScore, Long> {
    Optional<GameScore> findByStudentIdAndGame(Long studentId, String game);
    List<GameScore> findByGameOrderByHighScoreDesc(String game);
    List<GameScore> findAllByOrderByHighScoreDesc();
}