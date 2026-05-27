package com.example.demo.service;

import com.example.demo.entity.*;
import com.example.demo.exception.BusinessException;
import com.example.demo.exception.NotFoundException;
import com.example.demo.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
public class TutorService {

    @Autowired
    private TutorRepository tutorRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private WeeklyTemplateRepository weeklyTemplateRepository;

    @Autowired
    private InvitationTokenRepository invitationTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Tutor registerTutor(String email, String password, String fullName, String phone, String timezone) {
        if (tutorRepository.existsByEmail(email)) {
            throw new BusinessException("Репетитор с таким email уже существует");
        }

        Tutor tutor = new Tutor(
                email,
                passwordEncoder.encode(password),
                fullName,
                phone
        );

        if (timezone != null && !timezone.isEmpty()) {
            tutor.setTimezone(timezone);
        }

        return tutorRepository.save(tutor);
    }

    public Tutor login(String email, String password) {
        Optional<Tutor> optionalTutor = tutorRepository.findByEmail(email);

        if (optionalTutor.isEmpty()) {
            throw new NotFoundException("Репетитор", "email", email);
        }

        Tutor tutor = optionalTutor.get();

        if (!passwordEncoder.matches(password, tutor.getPasswordHash())) {
            throw new BusinessException("Неверный пароль");
        }

        return tutor;
    }

    public Tutor getTutorById(Long id) {
        return tutorRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Репетитор", "id", id));
    }

    public Map<String, Object> getReferralStats(Long tutorId) {
        long count = tutorRepository.countByReferredBy(tutorId);
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalReferrals", count);
        stats.put("bonusDays", count * 7);
        return stats;
    }

    public Tutor updateTutor(Long id, String phone, String fullName,
                             String birthday, String about, String city) {
        Tutor tutor = getTutorById(id);

        if (phone != null) tutor.setPhone(phone);
        if (fullName != null) tutor.setFullName(fullName);
        if (birthday != null && !birthday.isEmpty()) tutor.setBirthday(LocalDate.parse(birthday));
        if (about != null) tutor.setAbout(about);
        if (city != null) tutor.setCity(city);
        return tutorRepository.save(tutor);
    }

    public Tutor findByEmail(String email) {
        return tutorRepository.findByEmail(email).orElse(null);
    }

    public void saveResetToken(String email, String token) {
        Tutor tutor = tutorRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        tutor.setResetToken(token);
        tutor.setResetTokenExpiry(LocalDateTime.now().plusHours(24));
        tutorRepository.save(tutor);
    }

    public boolean resetPassword(String token, String newPassword) {
        Optional<Tutor> optionalTutor = tutorRepository.findByResetToken(token);
        if (optionalTutor.isEmpty()) return false;

        Tutor tutor = optionalTutor.get();
        if (tutor.getResetTokenExpiry() == null || tutor.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            return false;
        }

        tutor.setPasswordHash(passwordEncoder.encode(newPassword));
        tutor.setResetToken(null);
        tutor.setResetTokenExpiry(null);
        tutorRepository.save(tutor);
        return true;
    }

    public boolean isValidResetToken(String token) {
        Optional<Tutor> optionalTutor = tutorRepository.findByResetToken(token);
        if (optionalTutor.isEmpty()) return false;
        Tutor tutor = optionalTutor.get();
        return tutor.getResetTokenExpiry() != null && tutor.getResetTokenExpiry().isAfter(LocalDateTime.now());
    }

    public void changePassword(Long id, String currentPassword, String newPassword) {
        Tutor tutor = getTutorById(id);
        if (!passwordEncoder.matches(currentPassword, tutor.getPasswordHash())) {
            throw new BusinessException("Неверный текущий пароль");
        }
        if (newPassword == null || newPassword.length() < 6) {
            throw new BusinessException("Пароль должен быть не менее 6 символов");
        }
        tutor.setPasswordHash(passwordEncoder.encode(newPassword));
        tutorRepository.save(tutor);
    }

    public List<Tutor> getAllTutors() {
        return tutorRepository.findAll();
    }

    public void updateAvatar(Long id, String avatarBase64) {
        Tutor tutor = getTutorById(id);
        tutor.setAvatar(avatarBase64);
        tutorRepository.save(tutor);
    }

    public Tutor save(Tutor tutor) {
        return tutorRepository.save(tutor);
    }

    public Tutor findByReferralCode(String referralCode) {
        return tutorRepository.findByReferralCode(referralCode).orElse(null);
    }

    public Map<String, Object> exportUserData(Long tutorId) {
        Tutor tutor = getTutorById(tutorId);
        Map<String, Object> data = new HashMap<>();

        data.put("fullName", tutor.getFullName());
        data.put("email", tutor.getEmail());
        data.put("phone", tutor.getPhone());
        data.put("birthday", tutor.getBirthday() != null ? tutor.getBirthday().toString() : null);
        data.put("city", tutor.getCity());
        data.put("about", tutor.getAbout());
        data.put("timezone", tutor.getTimezone());
        data.put("referralCode", tutor.getReferralCode());

        // Ученики
        List<Map<String, Object>> studentsList = new ArrayList<>();
        for (Student s : studentRepository.findByTutorId(tutorId)) {
            Map<String, Object> sm = new HashMap<>();
            sm.put("id", s.getId());
            sm.put("fullName", s.getFullName());
            sm.put("email", s.getEmail());
            sm.put("paymentType", s.getPaymentTypeForTutor(tutorId));
            sm.put("ratePerLesson", s.getRateForTutor(tutorId));
            sm.put("discount", s.getDiscount());
            studentsList.add(sm);
        }
        data.put("students", studentsList);

        // Уроки (последние 100)
        List<Map<String, Object>> lessonsList = new ArrayList<>();
        List<Lesson> lessons = lessonRepository.findAllByTutorIdSince(tutorId, LocalDate.now().minusDays(365));
        for (Lesson l : lessons.stream().limit(100).toList()) {
            Map<String, Object> lm = new HashMap<>();
            lm.put("id", l.getId());
            lm.put("date", l.getLessonDate().toString());
            lm.put("time", l.getStartTime().toString() + "-" + l.getEndTime().toString());
            lm.put("status", l.getStatus());
            lm.put("student", l.getStudent().getFullName());
            lm.put("notes", l.getNotes());
            lm.put("nextLessonPlan", l.getNextLessonPlan());
            lessonsList.add(lm);
        }
        data.put("lessons", lessonsList);
        data.put("lessonsCount", lessons.size());

        // Платежи
        List<Map<String, Object>> paymentsList = new ArrayList<>();
        List<Payment> payments = paymentRepository.findByTutorId(tutorId);
        for (Payment p : payments) {
            Map<String, Object> pm = new HashMap<>();
            pm.put("id", p.getId());
            pm.put("amount", p.getAmount());
            pm.put("date", p.getPaymentDate().toString());
            pm.put("type", p.getPaymentType());
            pm.put("status", p.getStatus());
            pm.put("student", p.getStudent().getFullName());
            paymentsList.add(pm);
        }
        data.put("payments", paymentsList);
        data.put("paymentsCount", payments.size());
        data.put("totalIncome", payments.stream().filter(p -> "PAID".equals(p.getStatus())).mapToDouble(Payment::getAmount).sum());

        // Абонементы
        List<Map<String, Object>> subsList = new ArrayList<>();
        List<Subscription> subs = subscriptionRepository.findAllByTutorId(tutorId);
        for (Subscription sub : subs) {
            Map<String, Object> sm = new HashMap<>();
            sm.put("id", sub.getId());
            sm.put("student", sub.getStudent().getFullName());
            sm.put("lessonsCount", sub.getLessonsCount());
            sm.put("lessonsUsed", sub.getLessonsUsed());
            sm.put("debtLessons", sub.getDebtLessons());
            sm.put("price", sub.getPrice());
            sm.put("status", sub.getStatus());
            sm.put("startDate", sub.getStartDate().toString());
            sm.put("endDate", sub.getEndDate().toString());
            subsList.add(sm);
        }
        data.put("subscriptions", subsList);
        data.put("exportDate", LocalDateTime.now().toString());

        return data;
    }

    @Transactional
    public void deleteTutor(Long tutorId) {
        Tutor tutor = getTutorById(tutorId);

        // Удаляем уроки
        List<Lesson> lessons = lessonRepository.findByStudentIdOrderByLessonDateAscStartTimeAsc(tutorId);
        for (Lesson l : lessons) {
            lessonRepository.delete(l);
        }

        // Удаляем платежи
        List<Payment> payments = paymentRepository.findByTutorId(tutorId);
        paymentRepository.deleteAll(payments);

        // Удаляем абонементы
        List<Subscription> subs = subscriptionRepository.findAllByTutorId(tutorId);
        subscriptionRepository.deleteAll(subs);

        // Удаляем шаблоны
        List<WeeklyTemplate> templates = weeklyTemplateRepository.findByTutorId(tutorId);
        if (templates != null && !templates.isEmpty()) {
            weeklyTemplateRepository.deleteAll(templates);
        }

        // Удаляем приглашения
        invitationTokenRepository.deleteByStudentId(tutorId);

        // Удаляем учеников
        List<Student> students = studentRepository.findByTutorId(tutorId);
        for (Student s : students) {
            if (s.getTutors().size() <= 1) {
                studentRepository.delete(s);
            }
        }

        // Удаляем репетитора
        tutorRepository.delete(tutor);
        log.info("🗑️ Репетитор id={} полностью удалён", tutorId);
    }
}