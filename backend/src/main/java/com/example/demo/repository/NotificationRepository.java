package com.example.demo.repository;

import com.example.demo.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByParentIdOrderByCreatedAtDesc(Long parentId);

    List<Notification> findByParentIdAndIsReadFalseOrderByCreatedAtDesc(Long parentId);

    long countByParentIdAndIsReadFalse(Long parentId);
}