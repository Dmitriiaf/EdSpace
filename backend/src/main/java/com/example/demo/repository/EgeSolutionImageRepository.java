package com.example.demo.repository;

import com.example.demo.entity.EgeSolutionImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EgeSolutionImageRepository extends JpaRepository<EgeSolutionImage, Long> {

    List<EgeSolutionImage> findBySolutionIdOrderByOrderIndexAsc(Long solutionId);

    void deleteBySolutionId(Long solutionId);
}