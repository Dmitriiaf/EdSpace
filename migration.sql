-- =====================================================
-- МИГРАЦИЯ: Заполнение course_id у старых домашних заданий
-- Проект: EdSpace
-- Дата: 05.05.2026
-- ВНИМАНИЕ: Сделайте бэкап перед выполнением!
-- =====================================================

-- Шаг 0: Проверка текущего состояния
SELECT 'Текущее состояние:' as info;
SELECT COUNT(*) as total_homework FROM homework;
SELECT COUNT(*) as null_course_homework FROM homework WHERE course_id IS NULL;

-- Шаг 1: Связываем ДЗ с курсами через уроки (по дате и студенту)
-- Если ДЗ было создано в день урока — берём course_id из этого урока
UPDATE homework h
SET course_id = l.course_id
FROM lesson l
WHERE h.student_id = l.student_id 
  AND h.created_at::date = l.lesson_date
  AND h.course_id IS NULL 
  AND l.course_id IS NOT NULL;

-- Шаг 2: Для оставшихся ДЗ — через последний активный курс студента
UPDATE homework h
SET course_id = (
    SELECT l.course_id 
    FROM lesson l 
    WHERE l.student_id = h.student_id 
      AND l.course_id IS NOT NULL
    ORDER BY l.lesson_date DESC
    LIMIT 1
)
WHERE h.course_id IS NULL;

-- Шаг 3: Для ДЗ, которые не удалось привязать к курсам — 
-- пробуем через таблицу course_student (связь студент-курс)
UPDATE homework h
SET course_id = (
    SELECT cs.course_id 
    FROM course_student cs 
    WHERE cs.student_id = h.student_id 
    LIMIT 1
)
WHERE h.course_id IS NULL;

-- Шаг 4: Проверка результата
SELECT 'После миграции:' as info;
SELECT COUNT(*) as total_homework FROM homework;
SELECT COUNT(*) as remaining_null FROM homework WHERE course_id IS NULL;

-- Если remaining_null > 0 — показываем какие именно:
SELECT h.id, h.student_id, h.created_at, h.task 
FROM homework h 
WHERE h.course_id IS NULL 
ORDER BY h.created_at DESC;

-- =====================================================
-- ДЛЯ ОТКАТА (если что-то пошло не так):
-- =====================================================
-- UPDATE homework SET course_id = NULL WHERE created_at < '2026-05-05';
-- =====================================================