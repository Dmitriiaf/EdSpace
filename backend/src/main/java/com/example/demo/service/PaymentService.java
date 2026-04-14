// ========== backend/src/main/java/com/example/demo/service/PaymentService.java (ИСПРАВЛЕННАЯ ВЕРСИЯ) ==========
package com.example.demo.service;

import com.example.demo.entity.*;
import com.example.demo.exception.BusinessException;
import com.example.demo.exception.NotFoundException;
import com.example.demo.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
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

    @Transactional
    public Payment createPaymentForLesson(Lesson lesson) {
        // Получаем ПРАВИЛЬНУЮ ставку для репетитора этого урока
        BigDecimal correctRate = lesson.getStudent().getRateForTutor(lesson.getTutor().getId());

        log.info("💰 СОЗДАНИЕ ПЛАТЕЖА:");
        log.info("   Ученик: {}", lesson.getStudent().getFullName());
        log.info("   Репетитор: {} (ID: {})", lesson.getTutor().getFullName(), lesson.getTutor().getId());
        log.info("   Ставка для этого репетитора: {}", correctRate);

        if (correctRate == null) {
            log.error("❌ ОШИБКА: Не указана ставка для ученика {}", lesson.getStudent().getFullName());
            // ✅ Заменено на BusinessException
            throw new BusinessException("Не указана ставка для ученика " + lesson.getStudent().getFullName());
        }

        Payment payment = new Payment(
                lesson.getTutor(),
                lesson.getStudent(),
                correctRate.doubleValue(),
                LocalDateTime.now(),
                "cash",
                "paid"
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

    public Payment createPaymentForLesson(Long tutorId, Long studentId, Double amount, String paymentType) {
        Tutor tutor = tutorRepository.findById(tutorId)
                // ✅ Заменено на NotFoundException
                .orElseThrow(() -> new NotFoundException("Репетитор", "id", tutorId));
        Student student = studentRepository.findById(studentId)
                // ✅ Заменено на NotFoundException
                .orElseThrow(() -> new NotFoundException("Ученик", "id", studentId));

        Payment payment = new Payment(tutor, student, amount,
                LocalDateTime.now(), paymentType, "paid");
        return paymentRepository.save(payment);
    }

    public Payment createPayment(Long tutorId, Long studentId, Double amount, String paymentType, String status) {
        Tutor tutor = tutorRepository.findById(tutorId)
                // ✅ Заменено на NotFoundException
                .orElseThrow(() -> new NotFoundException("Репетитор", "id", tutorId));
        Student student = studentRepository.findById(studentId)
                // ✅ Заменено на NotFoundException
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
        return paymentRepository.findByTutorIdAndStatus(tutorId, "pending");
    }

    public Payment getPaymentById(Long id) {
        return paymentRepository.findById(id)
                // ✅ Заменено на NotFoundException
                .orElseThrow(() -> new NotFoundException("Платёж", "id", id));
    }

    @Deprecated
    public Payment updatePaymentStatus(Long id, String status) {
        Payment payment = getPaymentById(id);
        payment.setStatus(status);
        return paymentRepository.save(payment);
    }

    @Transactional
    public Payment parentConfirmPayment(Long id) {
        Payment payment = getPaymentById(id);

        if (!"pending".equals(payment.getStatus())) {
            // ✅ Заменено на BusinessException
            throw new BusinessException("Этот платеж уже обработан");
        }

        payment.setStatus("paid");
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
                .filter(p -> "paid".equals(p.getStatus()))
                .mapToDouble(Payment::getAmount)
                .sum();

        double totalPending = allPayments.stream()
                .filter(p -> "pending".equals(p.getStatus()))
                .mapToDouble(Payment::getAmount)
                .sum();

        long paidCount = allPayments.stream()
                .filter(p -> "paid".equals(p.getStatus()))
                .count();

        long pendingCount = allPayments.stream()
                .filter(p -> "pending".equals(p.getStatus()))
                .count();

        return Map.of(
                "totalIncome", totalPaid,
                "totalDebt", totalPending,
                "paidPayments", paidCount,
                "pendingPayments", pendingCount
        );
    }
}