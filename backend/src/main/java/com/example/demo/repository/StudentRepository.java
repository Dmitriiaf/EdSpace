// ========== StudentRepository.java ==========
package com.example.demo.repository;

import com.example.demo.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {

    List<Student> findByEmail(String email);

    List<Student> findByParentId(Long parentId);

    @Query("SELECT s FROM Student s JOIN s.tutors t WHERE t.id = :tutorId")
    List<Student> findByTutorId(@Param("tutorId") Long tutorId);

    @Query("SELECT DISTINCT s.email FROM Student s WHERE s.id IN :ids")
    List<String> findEmailsByIds(@Param("ids") List<Long> ids);

    @Query("SELECT DISTINCT s.id FROM Student s WHERE s.email = :email")
    List<Long> findStudentIdsByEmail(@Param("email") String email);

    @Query("SELECT s.id FROM Student s JOIN s.tutors t WHERE t.id = :tutorId AND s.email = :email")
    List<Long> findStudentIdsByTutorIdAndEmail(@Param("tutorId") Long tutorId, @Param("email") String email);

    @Query("SELECT s FROM Student s LEFT JOIN FETCH s.rates r LEFT JOIN FETCH r.tutor WHERE s.id = :id")
    Optional<Student> findByIdWithRates(@Param("id") Long id);

    @Query("SELECT DISTINCT s FROM Student s " +
            "LEFT JOIN FETCH s.rates r " +
            "LEFT JOIN FETCH r.tutor t " +
            "JOIN s.tutors tutor " +
            "WHERE tutor.id = :tutorId")
    List<Student> findByTutorIdWithRates(@Param("tutorId") Long tutorId);

    @Query("SELECT DISTINCT s FROM Student s " +
            "LEFT JOIN FETCH s.rates r " +
            "LEFT JOIN FETCH r.tutor t " +
            "WHERE s.parent.id = :parentId")
    List<Student> findByParentIdWithRates(@Param("parentId") Long parentId);

    List<Student> findByFullNameContainingIgnoreCase(String fullName);

    @Query("SELECT COUNT(DISTINCT s) FROM Student s JOIN s.tutors t WHERE t.id = :tutorId")
    long countByTutorId(@Param("tutorId") Long tutorId);

    @Query("SELECT DISTINCT s FROM Student s " +
            "LEFT JOIN FETCH s.rates r " +
            "LEFT JOIN FETCH r.tutor t " +
            "JOIN s.tutors tutor " +
            "WHERE tutor.id = :tutorId AND s.archived = true")
    List<Student> findArchivedByTutorIdWithRates(@Param("tutorId") Long tutorId);

    Optional<Student> findByResetToken(String resetToken);

    // Проверить, привязан ли ученик к репетитору
    @Query("SELECT COUNT(s) > 0 FROM Student s JOIN s.tutors t WHERE s.id = :studentId AND t.id = :tutorId")
    boolean existsStudentTutor(@Param("studentId") Long studentId, @Param("tutorId") Long tutorId);

    @Modifying
    @Transactional
    @Query("DELETE FROM StudentBoard sb WHERE sb.student.id = :studentId")
    void deleteBoardNotesByStudentId(@Param("studentId") Long studentId);

    // Привязать ученика к репетитору
    @Modifying
    @Transactional
    @Query(value = "INSERT INTO student_tutor (student_id, tutor_id) VALUES (:studentId, :tutorId)", nativeQuery = true)
    void linkStudentToTutor(@Param("studentId") Long studentId, @Param("tutorId") Long tutorId);
}