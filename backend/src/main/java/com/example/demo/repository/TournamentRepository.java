package com.example.demo.repository;

import com.example.demo.entity.Tournament;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TournamentRepository extends JpaRepository<Tournament, Long> {

    List<Tournament> findAllByOrderByStartDateDesc();

    Optional<Tournament> findFirstByStatusOrderByStartDateDesc(String status);

    boolean existsByStatus(String status);
}