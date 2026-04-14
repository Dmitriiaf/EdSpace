// ========== backend/src/main/java/com/example/demo/repository/StepikTokenRepository.java ==========
package com.example.demo.repository;

import com.example.demo.entity.StepikToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StepikTokenRepository extends JpaRepository<StepikToken, Long> {
    Optional<StepikToken> findByTutorId(Long tutorId);
    void deleteByTutorId(Long tutorId);
}