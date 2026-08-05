package com.example.demo.repository;

import com.example.demo.entity.Tutor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface TutorRepository extends JpaRepository<Tutor, Long> {

    // Найти репетитора по email
    Optional<Tutor> findByEmail(String email);


    // Проверить, существует ли email
    boolean existsByEmail(String email);
    Optional<Tutor> findByResetToken(String resetToken);
    Optional<Tutor> findByReferralCode(String referralCode);
    long countByReferredBy(Long referrerId);

}