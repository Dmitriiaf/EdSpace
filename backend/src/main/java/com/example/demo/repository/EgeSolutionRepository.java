package com.example.demo.repository;

import com.example.demo.entity.EgeSolution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EgeSolutionRepository extends JpaRepository<EgeSolution, Long> {

    List<EgeSolution> findAllByOrderByTaskNumberAscCreatedAtDesc();

    List<EgeSolution> findByTaskNumberOrderByCreatedAtDesc(Integer taskNumber);

    long countByTaskNumber(Integer taskNumber);
}