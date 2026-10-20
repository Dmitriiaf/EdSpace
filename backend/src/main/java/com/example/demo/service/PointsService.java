package com.example.demo.service;

import com.example.demo.entity.PointsHistory;
import com.example.demo.entity.Student;
import com.example.demo.repository.PointsHistoryRepository;
import com.example.demo.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PointsService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private PointsHistoryRepository pointsHistoryRepository;

    /**
     * Начислить баллы ученику.
     * reason — код причины (HOMEWORK_4, HOMEWORK_5, MOCK_60_79 и т.д.)
     * relatedId — ID связанной сущности (ДЗ, пробник, турнир)
     */
    @Transactional
    public void award(Long studentId, int amount, String reason, Long relatedId) {
        if (amount <= 0) return;

        // Защита от повторного начисления за одну и ту же сущность
        if (relatedId != null && pointsHistoryRepository.existsByStudentIdAndReasonAndRelatedId(studentId, reason, relatedId)) {
            return;
        }

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

        int balance = student.getPointsBalance() != null ? student.getPointsBalance() : 0;
        int total = student.getPointsTotal() != null ? student.getPointsTotal() : 0;

        student.setPointsBalance(balance + amount);
        student.setPointsTotal(total + amount);
        studentRepository.save(student);

        PointsHistory history = new PointsHistory();
        history.setStudentId(studentId);
        history.setAmount(amount);
        history.setReason(reason);
        history.setRelatedId(relatedId);
        pointsHistoryRepository.save(history);
    }

    /**
     * Списать баллы (покупка в магазине).
     * Возвращает false, если не хватает баланса.
     */
    @Transactional
    public boolean spend(Long studentId, int amount, String reason, Long relatedId) {
        if (amount <= 0) return false;

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

        int balance = student.getPointsBalance() != null ? student.getPointsBalance() : 0;
        if (balance < amount) return false;

        student.setPointsBalance(balance - amount);
        studentRepository.save(student);

        PointsHistory history = new PointsHistory();
        history.setStudentId(studentId);
        history.setAmount(-amount);
        history.setReason(reason);
        history.setRelatedId(relatedId);
        pointsHistoryRepository.save(history);

        return true;
    }

    public List<PointsHistory> getHistory(Long studentId) {
        return pointsHistoryRepository.findByStudentIdOrderByCreatedAtDesc(studentId);
    }

    /**
     * Ранг по накопленным баллам (points_total).
     * Возвращает объект с ключом, названием, иконкой, цветом и порогами.
     */
    public RankInfo getRank(int pointsTotal) {
        if (pointsTotal >= 450) return new RankInfo("GURU", "Гуру алгоритмов", "👑", "rainbow", 450, null);
        if (pointsTotal >= 340) return new RankInfo("MASTER", "Магистр информатики", "🧠", "gold", 340, 450);
        if (pointsTotal >= 240) return new RankInfo("ENGINEER", "Инженер", "🚀", "orange", 240, 340);
        if (pointsTotal >= 150) return new RankInfo("PROGRAMMER", "Программист", "💻", "purple", 150, 240);
        if (pointsTotal >= 80)  return new RankInfo("PRACTICIAN", "Практик", "✏️", "blue", 80, 150);
        if (pointsTotal >= 30)  return new RankInfo("BOOKWORM", "Книжный червь", "📖", "green", 30, 80);
        return new RankInfo("NOVICE", "Новичок", "🐣", "gray", 0, 30);
    }

    /**
     * DTO ранга.
     */
    public static class RankInfo {
        public String key;
        public String title;
        public String icon;
        public String color;
        public int minPoints;
        public Integer nextThreshold; // null, если максимальный ранг

        public RankInfo(String key, String title, String icon, String color, int minPoints, Integer nextThreshold) {
            this.key = key;
            this.title = title;
            this.icon = icon;
            this.color = color;
            this.minPoints = minPoints;
            this.nextThreshold = nextThreshold;
        }
    }
}