package com.example.demo.service;

import com.example.demo.entity.*;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private ParentRepository parentRepository;

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Transactional
    public Notification createNotification(Long parentId, Long lessonId, String message) {
        Parent parent = parentRepository.findById(parentId)
                .orElseThrow(() -> new RuntimeException("Родитель не найден"));

        Lesson lesson = null;
        if (lessonId != null) {
            lesson = lessonRepository.findById(lessonId)
                    .orElseThrow(() -> new RuntimeException("Занятие не найдено"));
        }

        Notification notification = new Notification(parent, lesson, message);
        return notificationRepository.save(notification);
    }

    @Transactional
    public Notification createSubscriptionNotification(Long parentId, Long subscriptionId, String message) {
        Parent parent = parentRepository.findById(parentId)
                .orElseThrow(() -> new RuntimeException("Родитель не найден"));

        Notification notification = new Notification();
        notification.setParent(parent);
        notification.setMessage(message);
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());

        return notificationRepository.save(notification);
    }

    @Transactional
    public Notification createTutorNotification(Long tutorId, String message) {
        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new RuntimeException("Репетитор не найден"));

        Notification notification = new Notification();
        notification.setMessage(message);
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setTutorId(tutorId);

        return notificationRepository.save(notification);
    }

    public List<Notification> getNotificationsByParent(Long parentId) {
        return notificationRepository.findByParentIdOrderByCreatedAtDesc(parentId);
    }

    public List<Notification> getUnreadNotifications(Long parentId) {
        return notificationRepository.findByParentIdAndIsReadFalseOrderByCreatedAtDesc(parentId);
    }

    public long getUnreadCount(Long parentId) {
        return notificationRepository.countByParentIdAndIsReadFalse(parentId);
    }

    @Transactional
    public Notification markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Уведомление не найдено"));
        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(Long parentId) {
        List<Notification> notifications = notificationRepository.findByParentIdAndIsReadFalseOrderByCreatedAtDesc(parentId);
        for (Notification notification : notifications) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
    }

    // ========== НОВЫЕ МЕТОДЫ ДЛЯ УЧЕНИКОВ И РЕПЕТИТОРОВ ==========

    public List<Notification> getNotificationsByStudent(Long studentId) {
        return notificationRepository.findByStudentId(studentId);
    }

    public long getUnreadCountByStudent(Long studentId) {
        return notificationRepository.countUnreadByStudentId(studentId);
    }

    public List<Notification> getNotificationsByTutor(Long tutorId) {
        return notificationRepository.findByTutorId(tutorId);
    }

    public void markAllAsReadForTutor(Long tutorId) {
        List<Notification> notifications = notificationRepository.findByTutorIdAndIsReadFalse(tutorId);
        notifications.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(notifications);
    }

    public void markAllAsReadForStudent(Long studentId) {
        List<Notification> notifications = notificationRepository.findByStudentIdAndIsReadFalse(studentId);
        notifications.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(notifications);
    }

    public long getUnreadCountByTutor(Long tutorId) {
        return notificationRepository.countUnreadByTutorId(tutorId);
    }

    @Transactional
    public Notification createHomeworkNotification(Long studentId, Long tutorId, String message, String notificationType) {
        Notification notification = new Notification();
        if (studentId != null) {
            notification.setStudent(studentRepository.findById(studentId).orElse(null));
        }
        notification.setTutorId(tutorId);
        notification.setMessage(message);

        if (notificationType.equals("HOMEWORK_SUBMITTED")) {
            notification.setRecipientType("TUTOR");
        } else {
            notification.setRecipientType("STUDENT");
        }

        notification.setNotificationType(notificationType);
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());

        return notificationRepository.save(notification);
    }
}