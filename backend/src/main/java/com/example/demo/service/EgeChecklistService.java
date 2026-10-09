package com.example.demo.service;

import com.example.demo.entity.EgeChecklist;
import com.example.demo.entity.EgeChecklistItem;
import com.example.demo.entity.Student;
import com.example.demo.repository.EgeChecklistItemRepository;
import com.example.demo.repository.EgeChecklistRepository;
import com.example.demo.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class EgeChecklistService {

    private final EgeChecklistRepository checklistRepository;
    private final EgeChecklistItemRepository itemRepository;
    private final StudentRepository studentRepository;

    // ========== КАРТА 27 ЗАДАНИЙ ЕГЭ ПО ИНФОРМАТИКЕ ==========
    // taskNumber, difficulty (EASY/MEDIUM/HARD), solutionType (MANUAL/PROGRAMMING/LIBREOFFICE/BOTH),
    // primaryScore, topic
    private static final Object[][] EGE_INF_MAP = {
            {1,  "EASY",   "MANUAL",       1, "Логика"},
            {2,  "MEDIUM", "PROGRAMMING",  1, "Системы счисления"},
            {3,  "EASY",   "LIBREOFFICE",  1, "Базы данных"},
            {4,  "EASY",   "MANUAL",       1, "Кодирование"},
            {5,  "MEDIUM", "PROGRAMMING",  1, "Алгоритмы"},
            {6,  "EASY",   "MANUAL",       1, "Анализ алгоритмов"},
            {7,  "EASY",   "PROGRAMMING",  1, "Кодирование изображений"},
            {8,  "EASY",   "PROGRAMMING",  1, "Комбинаторика"},
            {9,  "MEDIUM", "PROGRAMMING",  1, "Обработка данных"},
            {10, "EASY",   "PROGRAMMING",  1, "Поиск информации"},
            {11, "MEDIUM", "MANUAL",       1, "Информационный объём"},
            {12, "EASY",   "MANUAL",       1, "Исполнение алгоритмов"},
            {13, "EASY",   "PROGRAMMING",  1, "Системы счисления"},
            {14, "EASY",   "PROGRAMMING",  1, "Позиционные системы"},
            {15, "MEDIUM", "PROGRAMMING",  1, "Множества"},
            {16, "EASY",   "PROGRAMMING",  1, "Рекурсия"},
            {17, "MEDIUM", "PROGRAMMING",  1, "Динамическое программирование"},
            {18, "EASY",   "LIBREOFFICE",  1, "Логические выражения"},
            {19, "EASY",   "PROGRAMMING",  1, "Теория игр"},
            {20, "EASY",   "PROGRAMMING",  1, "Теория игр (анализ)"},
            {21, "EASY",   "PROGRAMMING",  1, "Теория игр (стратегия)"},
            {22, "MEDIUM", "LIBREOFFICE",  1, "Параллельные вычисления"},
            {23, "MEDIUM", "BOTH",         1, "Динамика (прога/ручное)"},
            {24, "HARD",   "PROGRAMMING",  1, "Анализ текста"},
            {25, "MEDIUM", "PROGRAMMING",  1, "Программирование (числа)"},
            {26, "HARD",   "PROGRAMMING",  2, "Обработка данных (сложное)"},
            {27, "HARD",   "PROGRAMMING",  2, "Программирование (сложное)"},
    };

    // ========== СОЗДАНИЕ ==========
    @Transactional
    public EgeChecklist createChecklist(Long studentId, String examType, String subject) {
        // Проверяем, нет ли уже
        Optional<EgeChecklist> existing = checklistRepository
                .findByStudentIdAndExamTypeAndSubject(studentId, examType, subject);
        if (existing.isPresent()) {
            throw new RuntimeException("Чек-лист уже создан для этого ученика");
        }

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Ученик не найден"));

        EgeChecklist checklist = new EgeChecklist();
        checklist.setStudent(student);
        checklist.setExamType(examType);
        checklist.setSubject(subject);
        checklist = checklistRepository.save(checklist);

        // Генерируем 27 заданий
        List<EgeChecklistItem> items = new ArrayList<>();
        for (Object[] row : EGE_INF_MAP) {
            EgeChecklistItem item = new EgeChecklistItem();
            item.setChecklist(checklist);
            item.setTaskNumber((Integer) row[0]);
            item.setDifficulty((String) row[1]);
            item.setSolutionType((String) row[2]);
            item.setPrimaryScore((Integer) row[3]);
            item.setTopic((String) row[4]);
            item.setKnows(false);
            items.add(item);
        }
        itemRepository.saveAll(items);

        log.info("✅ Создан ЕГЭ-чеклист для ученика {} — {} заданий", studentId, items.size());
        return checklist;
    }

    // ========== ВСЕ УЧЕНИКИ С ЧЕК-ЛИСТАМИ (для репетитора) ==========
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllStudentsWithChecklists(Long tutorId) {
        // Получаем всех учеников репетитора
        List<Student> students = studentRepository.findByTutorId(tutorId);

        List<Map<String, Object>> result = new ArrayList<>();
        for (Student student : students) {
            Map<String, Object> item = new HashMap<>();
            item.put("student", Map.of(
                    "id", student.getId(),
                    "fullName", student.getFullName(),
                    "grade", student.getGrade() != null ? student.getGrade() : ""
            ));

            Optional<EgeChecklist> opt = checklistRepository
                    .findByStudentIdAndExamTypeAndSubject(student.getId(), "EGE", "INF");

            if (opt.isPresent()) {
                EgeChecklist checklist = opt.get();
                List<EgeChecklistItem> items = itemRepository
                        .findByChecklistIdOrderByTaskNumberAsc(checklist.getId());

                Map<String, Object> fullResponse = buildResponse(checklist, items);
                item.put("checklist", fullResponse.get("checklist"));
                item.put("items", fullResponse.get("items"));
                item.put("stats", fullResponse.get("stats"));
            } else {
                item.put("checklist", null);
                item.put("items", List.of());
                item.put("stats", null);
            }

            result.add(item);
        }

        // Сортировка: сначала с чек-листом, потом без; внутри — по имени
        result.sort((a, b) -> {
            boolean aHas = a.get("checklist") != null;
            boolean bHas = b.get("checklist") != null;
            if (aHas != bHas) return aHas ? -1 : 1;
            String aName = (String) ((Map<?, ?>) a.get("student")).get("fullName");
            String bName = (String) ((Map<?, ?>) b.get("student")).get("fullName");
            return aName.compareToIgnoreCase(bName);
        });

        return result;
    }

    // ========== ПОЛУЧЕНИЕ СО СТАТИСТИКОЙ ==========
    @Transactional(readOnly = true)
    public Map<String, Object> getChecklistWithStats(Long studentId, String examType, String subject) {
        Optional<EgeChecklist> opt = checklistRepository
                .findByStudentIdAndExamTypeAndSubject(studentId, examType, subject);

        if (opt.isEmpty()) {
            Map<String, Object> empty = new HashMap<>();
            empty.put("checklist", null);
            empty.put("items", List.of());
            empty.put("stats", null);
            return empty;
        }

        EgeChecklist checklist = opt.get();
        List<EgeChecklistItem> items = itemRepository.findByChecklistIdOrderByTaskNumberAsc(checklist.getId());

        return buildResponse(checklist, items);
    }

    // ========== ОБНОВЛЕНИЕ ЗАДАНИЯ ==========
    @Transactional
    public Map<String, Object> updateItem(Long itemId, Map<String, Object> body) {
        EgeChecklistItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Задание не найдено"));

        if (body.containsKey("knows")) {
            item.setKnows(Boolean.TRUE.equals(body.get("knows")));
        }
        if (body.containsKey("note")) {
            Object noteVal = body.get("note");
            item.setNote(noteVal == null ? null : noteVal.toString());
        }
        item = itemRepository.save(item);

        EgeChecklist checklist = item.getChecklist();
        List<EgeChecklistItem> allItems = itemRepository
                .findByChecklistIdOrderByTaskNumberAsc(checklist.getId());

        return buildResponse(checklist, allItems);
    }

    @Transactional
    public void deleteChecklist(Long checklistId) {
        checklistRepository.deleteById(checklistId);
    }

    // ========== ВСПОМОГАТЕЛЬНОЕ ==========
    private Map<String, Object> buildResponse(EgeChecklist checklist, List<EgeChecklistItem> items) {
        // Считаем статистику
        int totalPrimary = 0;
        int earnedPrimary = 0;

        int easyTotal = 0, easyKnown = 0;
        int mediumTotal = 0, mediumKnown = 0;
        int hardTotal = 0, hardKnown = 0;

        List<Integer> unknownNumbers = new ArrayList<>();

        for (EgeChecklistItem item : items) {
            int score = item.getPrimaryScore() != null ? item.getPrimaryScore() : 1;
            totalPrimary += score;
            if (Boolean.TRUE.equals(item.getKnows())) {
                earnedPrimary += score;
            } else {
                unknownNumbers.add(item.getTaskNumber());
            }

            switch (item.getDifficulty()) {
                case "EASY": easyTotal++; if (Boolean.TRUE.equals(item.getKnows())) easyKnown++; break;
                case "MEDIUM": mediumTotal++; if (Boolean.TRUE.equals(item.getKnows())) mediumKnown++; break;
                case "HARD": hardTotal++; if (Boolean.TRUE.equals(item.getKnows())) hardKnown++; break;
            }
        }

        // Приблизительная оценка (округление процента первичных баллов × 100)
        // Официальная таблица перевода первичных баллов ЕГЭ (информатика, 2026)
        int[] PRIMARY_TO_TEST = {
                0,   // 0 первичных
                7,   // 1
                14,  // 2
                20,  // 3
                27,  // 4
                34,  // 5
                40,  // 6
                43,  // 7
                46,  // 8
                48,  // 9
                51,  // 10
                54,  // 11
                56,  // 12
                59,  // 13
                62,  // 14
                64,  // 15
                67,  // 16
                70,  // 17
                72,  // 18
                75,  // 19
                78,  // 20
                80,  // 21
                83,  // 22
                85,  // 23
                88,  // 24
                90,  // 25
                93,  // 26
                95,  // 27
                98,  // 28
                100  // 29
        };

        int estimatedScore = 0;
        if (earnedPrimary >= 0 && earnedPrimary < PRIMARY_TO_TEST.length) {
            estimatedScore = PRIMARY_TO_TEST[earnedPrimary];
        } else if (earnedPrimary >= PRIMARY_TO_TEST.length) {
            estimatedScore = 100;
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalTasks", items.size());
        stats.put("knownTasks", items.size() - unknownNumbers.size());
        stats.put("totalPrimary", totalPrimary);
        stats.put("earnedPrimary", earnedPrimary);
        stats.put("estimatedScore", estimatedScore);
        stats.put("unknownNumbers", unknownNumbers);

        Map<String, Object> byDifficulty = new HashMap<>();
        byDifficulty.put("easy", Map.of("total", easyTotal, "known", easyKnown));
        byDifficulty.put("medium", Map.of("total", mediumTotal, "known", mediumKnown));
        byDifficulty.put("hard", Map.of("total", hardTotal, "known", hardKnown));
        stats.put("byDifficulty", byDifficulty);

        Map<String, Object> result = new HashMap<>();
        result.put("checklist", checklist);
        result.put("items", items);
        result.put("stats", stats);
        return result;
    }
}