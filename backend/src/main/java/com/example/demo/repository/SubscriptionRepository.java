package com.example.demo.repository;

import com.example.demo.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    List<Subscription> findByStudentId(Long studentId);

    // ✅ ВОЗВРАЩЁННЫЙ МЕТОД
    List<Subscription> findAllByTutorId(Long tutorId);

    // ✅ ВОЗВРАЩЁННЫЙ МЕТОД
    List<Subscription> findByStudentIdAndStatus(Long studentId, String status);

    @Query("SELECT s FROM Subscription s WHERE s.student.id = :studentId AND s.status = 'active'")
    List<Subscription> findActiveByStudentId(@Param("studentId") Long studentId);
}