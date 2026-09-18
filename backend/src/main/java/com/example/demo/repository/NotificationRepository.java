package com.example.demo.repository;

import com.example.demo.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // Существующие методы для родителей
    List<Notification> findByParentIdOrderByCreatedAtDesc(Long parentId);
    List<Notification> findByParentIdAndIsReadFalseOrderByCreatedAtDesc(Long parentId);
    long countByParentIdAndIsReadFalse(Long parentId);
    void deleteByStudentId(Long studentId);

    List<Notification> findByTutorIdAndIsReadFalse(Long tutorId);
    List<Notification> findByStudentIdAndIsReadFalse(Long studentId);

    // Новые методы для учеников
    @Query("SELECT n FROM Notification n WHERE n.student.id = :studentId AND n.recipientType = 'STUDENT' ORDER BY n.createdAt DESC")
    List<Notification> findByStudentId(@Param("studentId") Long studentId);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.student.id = :studentId AND n.recipientType = 'STUDENT' AND n.isRead = false")
    long countUnreadByStudentId(@Param("studentId") Long studentId);

    // Новые методы для репетиторов
    @Query("SELECT n FROM Notification n WHERE n.tutorId = :tutorId AND n.recipientType = 'TUTOR' ORDER BY n.createdAt DESC")
    List<Notification> findByTutorId(@Param("tutorId") Long tutorId);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.tutorId = :tutorId AND n.recipientType = 'TUTOR' AND n.isRead = false")
    long countUnreadByTutorId(@Param("tutorId") Long tutorId);

    @Query("SELECT n FROM Notification n WHERE n.tutorId = :tutorId ORDER BY n.createdAt DESC")
    List<Notification> findAllByTutorId(@Param("tutorId") Long tutorId);
}