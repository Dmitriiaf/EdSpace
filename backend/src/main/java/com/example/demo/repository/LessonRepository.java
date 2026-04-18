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

    List<Lesson> findByTutorIdAndLessonDateOrderByStartTimeAsc(Long tutorId, LocalDate date);

    @Query("SELECT l FROM Lesson l WHERE l.tutor.id = :tutorId AND l.lessonDate >= :today AND l.status IN ('SCHEDULED', 'RESCHEDULED') ORDER BY l.lessonDate ASC, l.startTime ASC")
    List<Lesson> findUpcomingLessons(@Param("tutorId") Long tutorId, @Param("today") LocalDate today);

    @Query("SELECT l FROM Lesson l WHERE l.tutor.id = :tutorId ORDER BY l.lessonDate DESC, l.startTime DESC")
    List<Lesson> findAllByTutorId(@Param("tutorId") Long tutorId);

    @Query("SELECT l FROM Lesson l WHERE l.tutor.id = :tutorId AND (l.status = 'COMPLETED' OR l.status = 'PAID' OR l.status = 'CANCELLED') ORDER BY l.lessonDate DESC, l.startTime DESC")
    List<Lesson> findArchivedLessons(@Param("tutorId") Long tutorId);

    List<Lesson> findByStudentIdOrderByLessonDateAscStartTimeAsc(Long studentId);

    @Query("SELECT l FROM Lesson l LEFT JOIN FETCH l.course WHERE l.id = :id")
    Optional<Lesson> findByIdWithDetails(@Param("id") Long id);

    // ✅ ВОЗВРАЩЁННЫЙ МЕТОД
    boolean existsByTutorIdAndLessonDateAndStartTime(Long tutorId, LocalDate date, LocalTime startTime);

    // ✅ ВОЗВРАЩЁННЫЙ МЕТОД
    @Query("SELECT COUNT(l) FROM Lesson l WHERE l.student.id = :studentId AND l.lessonDate BETWEEN :startDate AND :endDate")
    long countLessonsInMonth(@Param("studentId") Long studentId,
                             @Param("startDate") LocalDate startDate,
                             @Param("endDate") LocalDate endDate);

    @Query("SELECT COUNT(l) > 0 FROM Lesson l WHERE l.tutor.id = :tutorId AND l.lessonDate = :date AND l.status != 'CANCELLED' AND " +
            "(l.startTime < :endTime AND l.endTime > :startTime)")
    boolean isTutorSlotOverlapping(@Param("tutorId") Long tutorId,
                                   @Param("date") LocalDate date,
                                   @Param("startTime") LocalTime startTime,
                                   @Param("endTime") LocalTime endTime);

    @Query("SELECT COUNT(l) > 0 FROM Lesson l WHERE l.student.id IN :studentIds AND l.lessonDate = :date AND l.status != 'CANCELLED' AND " +
            "(l.startTime < :endTime AND l.endTime > :startTime)")
    boolean isStudentSlotOverlapping(@Param("studentIds") List<Long> studentIds,
                                     @Param("date") LocalDate date,
                                     @Param("startTime") LocalTime startTime,
                                     @Param("endTime") LocalTime endTime);

    @Query("SELECT COUNT(l) > 0 FROM Lesson l WHERE l.student.id IN :studentIds AND l.tutor.id = :tutorId AND l.lessonDate = :date AND l.status != 'CANCELLED' AND " +
            "(l.startTime < :endTime AND l.endTime > :startTime)")
    boolean isStudentSlotOverlappingForTutor(@Param("studentIds") List<Long> studentIds,
                                             @Param("tutorId") Long tutorId,
                                             @Param("date") LocalDate date,
                                             @Param("startTime") LocalTime startTime,
                                             @Param("endTime") LocalTime endTime);

    @Query("SELECT COUNT(l) > 0 FROM Lesson l WHERE l.student.id IN :studentIds AND l.tutor.id = :tutorId AND l.lessonDate = :date AND l.status != 'CANCELLED' AND l.id != :excludeLessonId AND " +
            "(l.startTime < :endTime AND l.endTime > :startTime)")
    boolean isStudentSlotOverlappingForTutorExcluding(@Param("studentIds") List<Long> studentIds,
                                                      @Param("tutorId") Long tutorId,
                                                      @Param("date") LocalDate date,
                                                      @Param("startTime") LocalTime startTime,
                                                      @Param("endTime") LocalTime endTime,
                                                      @Param("excludeLessonId") Long excludeLessonId);

    @Query("SELECT COUNT(l) > 0 FROM Lesson l WHERE l.tutor.id = :tutorId AND l.lessonDate = :date AND l.status != 'CANCELLED' AND l.id != :excludeLessonId AND " +
            "(l.startTime < :endTime AND l.endTime > :startTime)")
    boolean isTutorSlotOverlappingExcluding(@Param("tutorId") Long tutorId,
                                            @Param("date") LocalDate date,
                                            @Param("startTime") LocalTime startTime,
                                            @Param("endTime") LocalTime endTime,
                                            @Param("excludeLessonId") Long excludeLessonId);
}