package com.example.demo.service;

import com.example.demo.entity.*;
import com.example.demo.exception.BusinessException;
import com.example.demo.exception.NotFoundException;
import com.example.demo.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private JavaMailSender mailSender;

    @Transactional
    public Payment createPaymentForLesson(Lesson lesson) {
        BigDecimal correctRate = lesson.getStudent().getRateForTutor(lesson.getTutor().getId());

        log.info("💰 СОЗДАНИЕ ПЛАТЕЖА:");
        log.info("   Ученик: {}", lesson.getStudent().getFullName());
        log.info("   Репетитор: {} (ID: {})", lesson.getTutor().getFullName(), lesson.getTutor().getId());
        log.info("   Ставка для этого репетитора: {}", correctRate);

        if (correctRate == null) {
            log.error("❌ ОШИБКА: Не указана ставка для ученика {}", lesson.getStudent().getFullName());
            throw new BusinessException("Не указана ставка для ученика " + lesson.getStudent().getFullName());
        }

        Payment payment = new Payment(
                lesson.getTutor(),
                lesson.getStudent(),
                correctRate.doubleValue(),
                LocalDateTime.now(),
                "cash",
                "PAID"
        );
        payment.setLesson(lesson);
        payment.setLessonDate(lesson.getLessonDate());
        payment.setConfirmedByParent(true);

        if (lesson.getCourse() != null) {
            payment.setCourseName(lesson.getCourse().getName());
        } else {
            payment.setCourseName("Занятие");
        }

        if (lesson.getTutor() != null) {
            payment.setTutorName(lesson.getTutor().getFullName());
        }

        Payment saved = paymentRepository.save(payment);
        log.info("✅ Платёж сохранён: ID={}, сумма={} ₽", saved.getId(), saved.getAmount());

        return saved;
    }

    public boolean existsByReceiptNumber(String receiptNumber) {
        if (receiptNumber == null || receiptNumber.isEmpty()) return false;
        return paymentRepository.existsByReceiptNumber(receiptNumber);
    }

    public Payment savePayment(Payment payment) {
        return paymentRepository.save(payment);
    }

    public Payment createPaymentForLesson(Long tutorId, Long studentId, Double amount, String paymentType) {
        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new NotFoundException("Репетитор", "id", tutorId));
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new NotFoundException("Ученик", "id", studentId));

        Payment payment = new Payment(tutor, student, amount, LocalDateTime.now(), paymentType, "PAID");

        List<Lesson> completedLessons = lessonRepository.findByStudentIdAndTutorIdAndStatus(studentId, tutorId, "COMPLETED");
        if (!completedLessons.isEmpty()) {
            Lesson lastLesson = completedLessons.get(completedLessons.size() - 1);
            payment.setLesson(lastLesson);
            payment.setLessonDate(lastLesson.getLessonDate());
        }

        return paymentRepository.save(payment);
    }

    public Payment createPayment(Long tutorId, Long studentId, Double amount, String paymentType, String status) {
        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new NotFoundException("Репетитор", "id", tutorId));
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new NotFoundException("Ученик", "id", studentId));

        Payment payment = new Payment(tutor, student, amount,
                LocalDateTime.now(), paymentType, status);
        return paymentRepository.save(payment);
    }

    public List<Payment> getPaymentsByTutor(Long tutorId) {
        return paymentRepository.findByTutorId(tutorId);
    }

    public List<Payment> getPaymentsByStudent(Long studentId) {
        return paymentRepository.findByStudentId(studentId);
    }

    public List<Payment> getPaymentsByPeriod(Long tutorId, LocalDateTime start, LocalDateTime end) {
        return paymentRepository.findByTutorIdAndPaymentDateBetween(tutorId, start, end);
    }

    public List<Payment> getPendingPayments(Long tutorId) {
        return paymentRepository.findByTutorIdAndStatus(tutorId, "PAID");
    }

    public Payment getPaymentById(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Платёж", "id", id));
    }

    @Transactional
    public Payment updatePaymentStatus(Long id, String newStatus) {
        Payment payment = getPaymentById(id);

        // Валидация статусов
        List<String> allowedStatuses = List.of("CONFIRMED", "REJECTED", "PAID", "PENDING");
        if (!allowedStatuses.contains(newStatus)) {
            throw new BusinessException("Недопустимый статус: " + newStatus + ". Разрешены: " + allowedStatuses);
        }

        // Проверка перехода из PAID
        if ("CONFIRMED".equals(newStatus) || "REJECTED".equals(newStatus)) {
            if (!"PAID".equals(payment.getStatus())) {
                throw new BusinessException("Можно подтвердить или отклонить только платёж в статусе PAID. Текущий: " + payment.getStatus());
            }
        }

        String oldStatus = payment.getStatus();
        payment.setStatus(newStatus);
        Payment saved = paymentRepository.save(payment);

        // Если подтверждён — обновляем урок
        if ("CONFIRMED".equals(newStatus) && payment.getLesson() != null) {
            Lesson lesson = payment.getLesson();
            lesson.setStatus("CONFIRMED");
            lesson.setPaidAt(LocalDateTime.now());
            lessonRepository.save(lesson);
            log.info("✅ Урок {} оплачен (подтверждён платёж {})", lesson.getId(), payment.getId());
        }

        // Если отклонён — возвращаем урок в COMPLETED
        if ("REJECTED".equals(newStatus) && payment.getLesson() != null) {
            Lesson lesson = payment.getLesson();
            lesson.setStatus("COMPLETED");
            lesson.setPaidAt(null);
            lessonRepository.save(lesson);
            log.info("↩️ Урок {} возвращён в COMPLETED (платёж {} отклонён)", lesson.getId(), payment.getId());
        }

        // Уведомление родителю
        try {
            notifyParentAboutStatusChange(payment, newStatus);
        } catch (Exception e) {
            log.warn("Не удалось уведомить родителя: {}", e.getMessage());
        }

        log.info("Статус платежа {} изменён: {} → {}", id, oldStatus, newStatus);
        return saved;
    }

    @Transactional
    public Payment parentConfirmPayment(Long id) {
        Payment payment = getPaymentById(id);

        if (!"PENDING".equals(payment.getStatus())) {
            throw new BusinessException("Этот платеж уже обработан. Текущий статус: " + payment.getStatus());
        }

        payment.setStatus("PAID");
        payment.setConfirmedByParent(true);
        return paymentRepository.save(payment);
    }

    public Payment addNotes(Long id, String notes) {
        Payment payment = getPaymentById(id);
        payment.setNotes(notes);
        return paymentRepository.save(payment);
    }

    public void deletePayment(Long id) {
        Payment payment = getPaymentById(id);
        paymentRepository.delete(payment);
    }

    public Double getTotalIncome(Long tutorId, LocalDateTime start, LocalDateTime end) {
        Double total = paymentRepository.getTotalIncomeForPeriod(tutorId, start, end);
        return total != null ? total : 0.0;
    }

    public Map<String, Object> getPaymentStats(Long tutorId) {
        List<Payment> allPayments = paymentRepository.findByTutorId(tutorId);

        double totalPaid = allPayments.stream()
                .filter(p -> "CONFIRMED".equals(p.getStatus()) || "PAID".equals(p.getStatus()))
                .mapToDouble(Payment::getAmount)
                .sum();

        double totalPending = allPayments.stream()
                .filter(p -> "PAID".equals(p.getStatus()))
                .mapToDouble(Payment::getAmount)
                .sum();

        long paidCount = allPayments.stream()
                .filter(p -> "CONFIRMED".equals(p.getStatus()))
                .count();

        long pendingCount = allPayments.stream()
                .filter(p -> "PAID".equals(p.getStatus()))
                .count();

        return Map.of(
                "totalIncome", totalPaid,
                "totalDebt", totalPending,
                "paidPayments", paidCount,
                "pendingPayments", pendingCount
        );
    }

    // ==================== УВЕДОМЛЕНИЯ ====================

    /**
     * Уведомить репетитора о новом чеке
     */
    public void notifyTutorAboutNewReceipt(Payment payment) {
        Tutor tutor = payment.getTutor();
        String studentName = payment.getStudent().getFullName();
        String amount = String.format("%.2f", payment.getAmount());

        String message = String.format(
                "📄 Новый чек от %s на сумму %s ₽ ожидает проверки",
                studentName, amount
        );

        // Системное уведомление (колокольчик)
        notificationService.createTutorNotification(
                tutor.getId(),
                message
        );

        // Email
        String tutorEmail = tutor.getEmail();
        if (tutorEmail != null && !tutorEmail.isBlank()) {
            try {
                SimpleMailMessage mailMessage = new SimpleMailMessage();
                mailMessage.setTo(tutorEmail);
                mailMessage.setSubject("Новый чек ожидает проверки — EdSpace");
                mailMessage.setText(String.format(
                        "Здравствуйте, %s!\n\n" +
                                "Родитель ученика %s загрузил чек на сумму %s ₽.\n\n" +
                                "Проверьте чек в личном кабинете:\n" +
                                "https://ed-space.ru/finance\n\n" +
                                "С уважением,\n" +
                                "команда EdSpace",
                        tutor.getFullName(), studentName, amount
                ));
                mailSender.send(mailMessage);
                log.info("📧 Email отправлен репетитору {} о новом чеке", tutorEmail);
            } catch (Exception e) {
                log.warn("Не удалось отправить email репетитору {}: {}", tutorEmail, e.getMessage());
            }
        }
    }

    /**
     * Уведомить родителя об изменении статуса платежа
     */
    private void notifyParentAboutStatusChange(Payment payment, String newStatus) {
        Student student = payment.getStudent();
        if (student.getParent() == null) return;

        Parent parent = student.getParent();
        String amount = String.format("%.2f", payment.getAmount());
        String message;
        String emailSubject;

        if ("CONFIRMED".equals(newStatus)) {
            message = String.format("✅ Ваш платёж на сумму %s ₽ подтверждён репетитором", amount);
            emailSubject = "Платёж подтверждён — EdSpace";
        } else if ("REJECTED".equals(newStatus)) {
            message = String.format("❌ Ваш платёж на сумму %s ₽ отклонён. Свяжитесь с репетитором для уточнения", amount);
            emailSubject = "Платёж отклонён — EdSpace";
        } else {
            return;
        }

        // Системное уведомление (колокольчик) — для родителя используем createNotification
        try {
            notificationService.createNotification(
                    parent.getId(),
                    payment.getLesson() != null ? payment.getLesson().getId() : null,
                    message
            );
        } catch (Exception e) {
            log.warn("Не удалось создать уведомление для родителя: {}", e.getMessage());
        }

        // Email
        String parentEmail = parent.getEmail();
        if (parentEmail != null && !parentEmail.isBlank()) {
            try {
                SimpleMailMessage mailMessage = new SimpleMailMessage();
                mailMessage.setTo(parentEmail);
                mailMessage.setSubject(emailSubject);
                mailMessage.setText(String.format(
                        "Здравствуйте!\n\n" +
                                "%s\n\n" +
                                "Ученик: %s\n" +
                                "Сумма: %s ₽\n\n" +
                                "Посмотреть статус:\n" +
                                "https://ed-space.ru/dashboard\n\n" +
                                "С уважением,\n" +
                                "команда EdSpace",
                        message, student.getFullName(), amount
                ));
                mailSender.send(mailMessage);
                log.info("📧 Email отправлен родителю {} об изменении статуса платежа", parentEmail);
            } catch (Exception e) {
                log.warn("Не удалось отправить email родителю {}: {}", parentEmail, e.getMessage());
            }
        }
    }
}