// ========== backend/src/main/java/com/example/demo/service/LessonConflictChecker.java (ИСПРАВЛЕННАЯ ВЕРСИЯ) ==========
package com.example.demo.service;

import com.example.demo.repository.LessonRepository;
import com.example.demo.repository.StudentRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Slf4j  // ✅ Добавлена аннотация Lombok для логирования
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

        List<Long> allStudentIds = studentRepository.findStudentIdsByEmail(studentEmail);

        if (allStudentIds.isEmpty()) {
            log.warn("⚠️ Ученик с email {} не найден в БД", studentEmail);
            return null;
        }

        log.info("Все ID ученика: {}", allStudentIds);

        boolean studentBusy = lessonRepository.isStudentSlotOverlapping(
                allStudentIds, date, startTime, endTime);

        if (studentBusy) {
            log.warn("❌ КОНФЛИКТ: У ученика уже есть занятие в это время с другим репетитором");
            return "У этого ученика уже есть занятие в это время с другим репетитором";
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

    public String checkConflictsForReschedule(Long lessonId, Long tutorId, String studentEmail,
                                              LocalDate date, LocalTime startTime, LocalTime endTime) {

        log.info("=== LessonConflictChecker: ПРОВЕРКА КОНФЛИКТОВ ПРИ ПЕРЕНОСЕ ===");
        log.info("Переносимое занятие ID: {}", lessonId);
        log.info("Репетитор ID: {}", tutorId);
        log.info("Ученик email: {}", studentEmail);
        log.info("Новая дата: {}, время: {}-{}", date, startTime, endTime);

        List<Long> allStudentIds = studentRepository.findStudentIdsByEmail(studentEmail);

        if (allStudentIds.isEmpty()) {
            log.warn("⚠️ Ученик с email {} не найден в БД", studentEmail);
            return null;
        }

        log.info("Все ID ученика: {}", allStudentIds);

        boolean studentBusy = lessonRepository.isStudentSlotOverlappingExcluding(
                allStudentIds, date, startTime, endTime, lessonId);

        if (studentBusy) {
            log.warn("❌ КОНФЛИКТ: У ученика уже есть занятие в это время с другим репетитором");
            return "У этого ученика уже есть занятие в это время с другим репетитором";
        }

        // ✅ ИСПРАВЛЕНО: используем метод с исключением для репетитора
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