// ========== backend/src/main/java/com/example/demo/repository/SubscriptionRepository.java (ПОЛНАЯ ЗАМЕНА) ==========
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

    List<Subscription> findByStudentIdAndStatus(Long studentId, String status);

    @Query("SELECT s FROM Subscription s WHERE s.student.id = :studentId AND s.status = 'active' AND s.startDate <= CURRENT_DATE AND s.endDate >= CURRENT_DATE")
    Subscription findActiveSubscription(@Param("studentId") Long studentId);

    List<Subscription> findByStudentIdAndStatusOrderByStartDateDesc(Long studentId, String status);

    @Query("SELECT s FROM Subscription s WHERE s.tutor.id = :tutorId ORDER BY s.startDate DESC")
    List<Subscription> findAllByTutorId(@Param("tutorId") Long tutorId);
}