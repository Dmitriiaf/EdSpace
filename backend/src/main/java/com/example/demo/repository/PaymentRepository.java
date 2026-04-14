package com.example.demo.repository;

import com.example.demo.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByTutorId(Long tutorId);

    List<Payment> findByStudentId(Long studentId);

    List<Payment> findByTutorIdAndPaymentDateBetween(Long tutorId, LocalDateTime start, LocalDateTime end);

    List<Payment> findByTutorIdAndStatus(Long tutorId, String status);

    List<Payment> findBySubscriptionId(Long subscriptionId);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.tutor.id = :tutorId " +
            "AND p.paymentDate BETWEEN :start AND :end AND p.status = 'paid'")
    Double getTotalIncomeForPeriod(@Param("tutorId") Long tutorId,
                                   @Param("start") LocalDateTime start,
                                   @Param("end") LocalDateTime end);

    @Query("SELECT p FROM Payment p WHERE p.lesson.id = :lessonId")
    Optional<Payment> findByLessonId(@Param("lessonId") Long lessonId);

    // ✅ НОВЫЙ МЕТОД ДЛЯ ЮKASSA
    @Query("SELECT p FROM Payment p WHERE p.externalPaymentId = :externalPaymentId")
    Optional<Payment> findByExternalPaymentId(@Param("externalPaymentId") String externalPaymentId);
}