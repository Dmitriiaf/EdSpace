package com.example.demo.repository;

import com.example.demo.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long> {

    // ✅ ОПТИМИЗИРОВАННЫЕ ЗАПРОСЫ С JOIN FETCH

    @Query("SELECT l FROM Lesson l " +
            "JOIN FETCH l.student s " +
            "JOIN FETCH l.tutor t " +
            "LEFT JOIN FETCH l.course c " +
            "WHERE l.tutor.id = :tutorId " +
            "ORDER BY l.lessonDate ASC, l.startTime ASC")
    List<Lesson> findAllByTutorId(@Param("tutorId") Long tutorId);

    @Query("SELECT l FROM Lesson l " +
            "JOIN FETCH l.student s " +
            "JOIN FETCH l.tutor t " +
            "LEFT JOIN FETCH l.course c " +
            "WHERE l.student.id = :studentId " +
            "ORDER BY l.lessonDate ASC, l.startTime ASC")
    List<Lesson> findByStudentIdOrderByLessonDateAscStartTimeAsc(@Param("studentId") Long studentId);

    @Query("SELECT l FROM Lesson l " +
            "JOIN FETCH l.student s " +
            "JOIN FETCH l.tutor t " +
            "LEFT JOIN FETCH l.course c " +
            "WHERE l.tutor.id = :tutorId AND l.lessonDate = :date " +
            "ORDER BY l.startTime ASC")
    List<Lesson> findByTutorIdAndLessonDateOrderByStartTimeAsc(@Param("tutorId") Long tutorId,
                                                               @Param("date") LocalDate date);

    @Query("SELECT l FROM Lesson l " +
            "JOIN FETCH l.student s " +
            "JOIN FETCH l.tutor t " +
            "LEFT JOIN FETCH l.course c " +
            "WHERE l.student.id = :studentId AND l.lessonDate = :date " +
            "ORDER BY l.startTime ASC")
    List<Lesson> findByStudentIdAndLessonDateOrderByStartTimeAsc(@Param("studentId") Long studentId,
                                                                 @Param("date") LocalDate date);

    @Query("SELECT l FROM Lesson l " +
            "JOIN FETCH l.student s " +
            "JOIN FETCH l.tutor t " +
            "LEFT JOIN FETCH l.course c " +
            "WHERE l.tutor.id = :tutorId AND l.lessonDate >= :date " +
            "AND l.status != 'CANCELLED' " +
            "ORDER BY l.lessonDate ASC, l.startTime ASC")
    List<Lesson> findUpcomingLessons(@Param("tutorId") Long tutorId, @Param("date") LocalDate date);

    @Query("SELECT l FROM Lesson l " +
            "JOIN FETCH l.student s " +
            "JOIN FETCH l.tutor t " +
            "LEFT JOIN FETCH l.course c " +
            "WHERE l.tutor.id = :tutorId " +
            "AND l.status IN ('PAID', 'COMPLETED', 'CANCELLED') " +
            "ORDER BY l.lessonDate DESC, l.startTime DESC")
    List<Lesson> findArchivedLessons(@Param("tutorId") Long tutorId);

    // Обычный findById с JOIN FETCH
    @Query("SELECT l FROM Lesson l " +
            "JOIN FETCH l.student s " +
            "JOIN FETCH l.tutor t " +
            "LEFT JOIN FETCH l.course c " +
            "WHERE l.id = :id")
    Optional<Lesson> findByIdWithDetails(@Param("id") Long id);

    // ========== ПРОВЕРКИ КОНФЛИКТОВ (БЕЗ JOIN FETCH ДЛЯ СКОРОСТИ) ==========

    @Query("SELECT COUNT(l) > 0 FROM Lesson l WHERE l.student.id = :studentId " +
            "AND l.lessonDate = :date AND l.startTime = :startTime " +
            "AND l.status != 'CANCELLED'")
    boolean isSlotBusy(@Param("studentId") Long studentId,
                       @Param("date") LocalDate date,
                       @Param("startTime") LocalTime startTime);

    @Query("SELECT COUNT(l) > 0 FROM Lesson l WHERE l.student.id IN :studentIds " +
            "AND l.lessonDate = :date AND l.startTime = :startTime " +
            "AND l.status != 'CANCELLED'")
    boolean isSlotBusyForStudents(@Param("studentIds") List<Long> studentIds,
                                  @Param("date") LocalDate date,
                                  @Param("startTime") LocalTime startTime);

    @Query("SELECT COUNT(l) > 0 FROM Lesson l WHERE l.tutor.id = :tutorId " +
            "AND l.lessonDate = :date " +
            "AND l.status != 'CANCELLED' " +
            "AND ((l.startTime <= :startTime AND l.endTime > :startTime) " +
            "     OR (l.startTime < :endTime AND l.endTime >= :endTime) " +
            "     OR (l.startTime >= :startTime AND l.endTime <= :endTime))")
    boolean isTutorSlotOverlapping(@Param("tutorId") Long tutorId,
                                   @Param("date") LocalDate date,
                                   @Param("startTime") LocalTime startTime,
                                   @Param("endTime") LocalTime endTime);

    @Query("SELECT COUNT(l) > 0 FROM Lesson l WHERE l.tutor.id = :tutorId " +
            "AND l.lessonDate = :date " +
            "AND l.id != :excludeId " +
            "AND l.status != 'CANCELLED' " +
            "AND ((l.startTime <= :startTime AND l.endTime > :startTime) " +
            "     OR (l.startTime < :endTime AND l.endTime >= :endTime) " +
            "     OR (l.startTime >= :startTime AND l.endTime <= :endTime))")
    boolean isTutorSlotOverlappingExcluding(@Param("tutorId") Long tutorId,
                                            @Param("date") LocalDate date,
                                            @Param("startTime") LocalTime startTime,
                                            @Param("endTime") LocalTime endTime,
                                            @Param("excludeId") Long excludeId);

    @Query("SELECT COUNT(l) > 0 FROM Lesson l WHERE l.student.id IN :studentIds " +
            "AND l.lessonDate = :date " +
            "AND l.status != 'CANCELLED' " +
            "AND ((l.startTime <= :startTime AND l.endTime > :startTime) " +
            "     OR (l.startTime < :endTime AND l.endTime >= :endTime) " +
            "     OR (l.startTime >= :startTime AND l.endTime <= :endTime))")
    boolean isStudentSlotOverlapping(@Param("studentIds") List<Long> studentIds,
                                     @Param("date") LocalDate date,
                                     @Param("startTime") LocalTime startTime,
                                     @Param("endTime") LocalTime endTime);

    @Query("SELECT COUNT(l) > 0 FROM Lesson l WHERE l.student.id IN :studentIds " +
            "AND l.lessonDate = :date " +
            "AND l.id != :excludeId " +
            "AND l.status != 'CANCELLED' " +
            "AND ((l.startTime <= :startTime AND l.endTime > :startTime) " +
            "     OR (l.startTime < :endTime AND l.endTime >= :endTime) " +
            "     OR (l.startTime >= :startTime AND l.endTime <= :endTime))")
    boolean isStudentSlotOverlappingExcluding(@Param("studentIds") List<Long> studentIds,
                                              @Param("date") LocalDate date,
                                              @Param("startTime") LocalTime startTime,
                                              @Param("endTime") LocalTime endTime,
                                              @Param("excludeId") Long excludeId);

    @Query("SELECT COUNT(l) > 0 FROM Lesson l WHERE l.tutor.id = :tutorId " +
            "AND l.lessonDate = :date " +
            "AND l.startTime = :startTime")
    boolean existsByTutorIdAndLessonDateAndStartTime(@Param("tutorId") Long tutorId,
                                                     @Param("date") LocalDate date,
                                                     @Param("startTime") LocalTime startTime);

    @Query("SELECT COUNT(l) FROM Lesson l WHERE l.student.id = :studentId " +
            "AND l.lessonDate BETWEEN :startDate AND :endDate " +
            "AND l.status != 'CANCELLED'")
    int countLessonsInMonth(@Param("studentId") Long studentId,
                            @Param("startDate") LocalDate startDate,
                            @Param("endDate") LocalDate endDate);

    void deleteByStudentId(Long studentId);
}