package com.example.demo.repository;

import com.example.demo.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    List<Subscription> findByStudentId(Long studentId);

    List<Subscription> findAllByTutorId(Long tutorId);

    List<Subscription> findByStudentIdAndStatus(Long studentId, String status);

    @Query("SELECT s FROM Subscription s WHERE s.student.id = :studentId AND s.status = 'ACTIVE' ORDER BY s.id DESC")
    Optional<Subscription> findActiveByStudentId(@Param("studentId") Long studentId);

    @Query("SELECT s FROM Subscription s WHERE s.student.id IN :studentIds")
    List<Subscription> findByStudentIdIn(@Param("studentIds") List<Long> studentIds);

    @Query("SELECT s FROM Subscription s WHERE s.student.id = :studentId ORDER BY s.id DESC LIMIT 1")
    Optional<Subscription> findFirstByStudentIdOrderByIdDesc(@Param("studentId") Long studentId);

    @Query("SELECT s FROM Subscription s WHERE s.student.id = :studentId AND s.tutor.id = :tutorId AND s.status = :status")
    Optional<Subscription> findByStudentIdAndTutorIdAndStatus(
            @Param("studentId") Long studentId,
            @Param("tutorId") Long tutorId,
            @Param("status") String status
    );
}