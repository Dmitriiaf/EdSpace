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
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long> {

    List<Lesson> findByTutorIdAndLessonDateOrderByStartTimeAsc(Long tutorId, LocalDate date);

    @Query("SELECT l FROM Lesson l WHERE l.originalLesson.id = :originalLessonId")
    Optional<Lesson> findByOriginalLessonId(@Param("originalLessonId") Long originalLessonId);

    @Query("SELECT l FROM Lesson l WHERE l.student.id = :studentId AND l.tutor.id = :tutorId AND l.status = :status ORDER BY l.lessonDate DESC")
    List<Lesson> findByStudentIdAndTutorIdAndStatus(
            @Param("studentId") Long studentId,
            @Param("tutorId") Long tutorId,
            @Param("status") String status);

    List<Lesson> findByGroupId(Long groupId);

    boolean existsByTutorIdAndStudentIdAndLessonDateAndStartTime(Long tutorId, Long studentId, LocalDate lessonDate, LocalTime startTime);

    List<Lesson> findByGroupIdAndLessonDateAfter(Long groupId, LocalDate date);

    List<Lesson> findByGroupIdAndLessonDate(Long groupId, LocalDate lessonDate);

    @Query("SELECT l FROM Lesson l WHERE l.lessonDate = :date AND l.startTime BETWEEN :startFrom AND :startTo AND l.status IN ('SCHEDULED', 'RESCHEDULED')")
    List<Lesson> findByLessonDateAndStartTimeBetween(
            @Param("date") LocalDate date,
            @Param("startFrom") LocalTime startFrom,
            @Param("startTo") LocalTime startTo);


    @Query("SELECT l FROM Lesson l WHERE l.student.id = :studentId AND l.tutor.id = :tutorId " +
            "AND l.course.id = :courseId AND l.status IN ('COMPLETED', 'PAID') " +
            "ORDER BY l.lessonDate DESC, l.startTime DESC")
    List<Lesson> findCompletedLessonsByStudentAndCourse(
            @Param("studentId") Long studentId,
            @Param("tutorId") Long tutorId,
            @Param("courseId") Long courseId
    );

    List<Lesson> findByStudentIdAndLessonDateBetween(Long studentId, LocalDate start, LocalDate end);

    List<Lesson> findByTutorIdAndLessonDateBetween(Long tutorId, LocalDate start, LocalDate end);

    List<Lesson> findByTutorIdAndLessonDate(Long tutorId, LocalDate lessonDate);

    @Query("SELECT l FROM Lesson l WHERE l.tutor.id = :tutorId AND l.lessonDate >= :since AND l.status IN ('SCHEDULED', 'RESCHEDULED', 'IN_PROGRESS') ORDER BY l.lessonDate ASC, l.startTime ASC")
    List<Lesson> findActiveLessonsSince(@Param("tutorId") Long tutorId, @Param("since") LocalDate since);

    @Query("SELECT l FROM Lesson l WHERE l.tutor.id = :tutorId AND l.lessonDate >= :today AND l.status IN ('SCHEDULED', 'RESCHEDULED') ORDER BY l.lessonDate ASC, l.startTime ASC")
    List<Lesson> findUpcomingLessons(@Param("tutorId") Long tutorId, @Param("today") LocalDate today);

    @Query("SELECT l FROM Lesson l WHERE l.tutor.id = :tutorId AND l.lessonDate >= :since ORDER BY l.lessonDate DESC, l.startTime DESC")
    List<Lesson> findAllByTutorIdSince(@Param("tutorId") Long tutorId, @Param("since") LocalDate since);

    @Query("SELECT l FROM Lesson l WHERE l.tutor.id = :tutorId AND (l.status = 'COMPLETED' OR l.status = 'PAID' OR l.status = 'CANCELLED') ORDER BY l.lessonDate DESC, l.startTime DESC")
    List<Lesson> findArchivedLessons(@Param("tutorId") Long tutorId);

    List<Lesson> findByStudentIdOrderByLessonDateAscStartTimeAsc(Long studentId);

    @Query("SELECT l FROM Lesson l LEFT JOIN FETCH l.course WHERE l.id = :id")
    Optional<Lesson> findByIdWithDetails(@Param("id") Long id);

    // ✅ ВОЗВРАЩЁННЫЙ МЕТОД
    boolean existsByTutorIdAndLessonDateAndStartTime(Long tutorId, LocalDate date, LocalTime startTime);

    @Modifying
    @Transactional
    @Query("DELETE FROM Lesson l WHERE l.weeklyTemplateId = :templateId AND l.lessonDate >= :afterDate AND l.status = 'SCHEDULED'")
    int deleteFutureLessonsByTemplateId(@Param("templateId") Long templateId, @Param("afterDate") LocalDate afterDate);

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
    @Query("SELECT l FROM Lesson l WHERE l.tutor.id = :tutorId AND l.student.id = :studentId " +
            "AND (:courseId IS NULL OR l.course.id = :courseId) " +
            "AND l.lessonDate > :afterDate " +
            "AND l.startTime = :startTime AND l.endTime = :endTime " +
            "AND l.status = 'SCHEDULED'")
    List<Lesson> findFutureTemplateLessons(
            @Param("tutorId") Long tutorId,
            @Param("studentId") Long studentId,
            @Param("courseId") Long courseId,
            @Param("afterDate") LocalDate afterDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );

    // Для автогенерации: поиск будущих уроков шаблона
    @Query("SELECT l FROM Lesson l WHERE l.weeklyTemplateId = :templateId AND l.lessonDate > :afterDate AND l.status = :status")
    List<Lesson> findByTemplateIdAndLessonDateAfterAndStatus(
            @Param("templateId") Long templateId,
            @Param("afterDate") LocalDate afterDate,
            @Param("status") String status);

    // Проверка существования урока шаблона на дату
    @Query("SELECT COUNT(l) > 0 FROM Lesson l WHERE l.weeklyTemplateId = :templateId AND l.lessonDate = :date")
    boolean existsByTemplateIdAndLessonDate(
            @Param("templateId") Long templateId,
            @Param("date") LocalDate date);

}