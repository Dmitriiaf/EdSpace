// ========== backend/src/main/java/com/example/demo/service/LessonConflictChecker.java (ЖЁСТКОЕ РЕШЕНИЕ) ==========
package com.example.demo.service;

import com.example.demo.repository.LessonRepository;
import com.example.demo.repository.StudentRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Slf4j
@Service
public class LessonConflictChecker {

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private StudentRepository studentRepository;

    public String checkConflicts(Long tutorId, String studentEmail,
                                 LocalDate date, LocalTime startTime, LocalTime endTime) {

        log.info("=== LessonConflictChecker: ПРОВЕРКА КОНФЛИКТОВ ===");
        log.info("Репетитор ID: {}", tutorId);
        log.info("Ученик email: {}", studentEmail);
        log.info("Дата: {}, время: {}-{}", date, startTime, endTime);

        List<Long> studentIdsForTutor = studentRepository.findStudentIdsByTutorIdAndEmail(tutorId, studentEmail);

        if (studentIdsForTutor.isEmpty()) {
            log.warn("⚠️ Ученик с email {} не привязан к репетитору {}", studentEmail, tutorId);
            return null;
        }

        log.info("ID ученика, привязанного к репетитору: {}", studentIdsForTutor);

        boolean studentBusy = lessonRepository.isStudentSlotOverlappingForTutor(
                studentIdsForTutor, tutorId, date, startTime, endTime);

        if (studentBusy) {
            log.warn("❌ КОНФЛИКТ: У ученика уже есть занятие в это время у этого репетитора");
            return "У этого ученика уже есть занятие в это время";
        }

        boolean tutorBusy = lessonRepository.isTutorSlotOverlapping(
                tutorId, date, startTime, endTime);

        if (tutorBusy) {
            log.warn("❌ КОНФЛИКТ: У репетитора уже есть занятие в это время");
            return "У репетитора уже есть занятие в это время";
        }

        log.info("✅ Конфликтов не обнаружено");
        return null;
    }

    public String checkConflictsForGroupLesson(Long tutorId, String studentEmail,
                                               LocalDate date, LocalTime startTime, LocalTime endTime) {
        List<Long> studentIdsForTutor = studentRepository.findStudentIdsByTutorIdAndEmail(tutorId, studentEmail);
        if (studentIdsForTutor.isEmpty()) return null;

        boolean studentBusy = lessonRepository.isStudentSlotOverlappingForTutor(
                studentIdsForTutor, tutorId, date, startTime, endTime);
        if (studentBusy) return "У ученика уже есть занятие в это время";

        return null; // ✅ Репетитора НЕ проверяем — это группа!
    }

    public String checkConflictsForReschedule(Long lessonId, Long tutorId, String studentEmail,
                                              LocalDate date, LocalTime startTime, LocalTime endTime) {

        log.info("=== LessonConflictChecker: ПРОВЕРКА КОНФЛИКТОВ ПРИ ПЕРЕНОСЕ ===");
        log.info("Переносимое занятие ID: {}", lessonId);
        log.info("Репетитор ID: {}", tutorId);
        log.info("Ученик email: {}", studentEmail);
        log.info("Новая дата: {}, время: {}-{}", date, startTime, endTime);

        List<Long> studentIdsForTutor = studentRepository.findStudentIdsByTutorIdAndEmail(tutorId, studentEmail);

        if (studentIdsForTutor.isEmpty()) {
            log.warn("⚠️ Ученик с email {} не привязан к репетитору {}", studentEmail, tutorId);
            return null;
        }

        log.info("ID ученика, привязанного к репетитору: {}", studentIdsForTutor);

        boolean studentBusy = lessonRepository.isStudentSlotOverlappingForTutorExcluding(
                studentIdsForTutor, tutorId, date, startTime, endTime, lessonId);

        if (studentBusy) {
            log.warn("❌ КОНФЛИКТ: У ученика уже есть занятие в это время у этого репетитора");
            return "У этого ученика уже есть занятие в это время";
        }

        boolean tutorBusy = lessonRepository.isTutorSlotOverlappingExcluding(
                tutorId, date, startTime, endTime, lessonId);

        if (tutorBusy) {
            log.warn("❌ КОНФЛИКТ: У репетитора уже есть занятие в это время");
            return "У репетитора уже есть занятие в это время";
        }

        log.info("✅ Конфликтов не обнаружено");
        return null;
    }
}