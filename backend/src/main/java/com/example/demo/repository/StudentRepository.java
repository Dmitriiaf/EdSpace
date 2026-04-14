package com.example.demo.repository;

import com.example.demo.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {

    List<Student> findByParentId(Long parentId);

    List<Student> findByEmail(String email);

    @Query("SELECT s.id FROM Student s WHERE s.email = :email")
    List<Long> findStudentIdsByEmail(@Param("email") String email);

    List<Student> findByFullNameContainingIgnoreCase(String name);

    // ✅ ОПТИМИЗИРОВАННЫЙ ЗАПРОС: загружаем студента с rates и tutors
    @Query("SELECT DISTINCT s FROM Student s " +
            "LEFT JOIN FETCH s.rates r " +
            "LEFT JOIN FETCH r.tutor " +
            "WHERE s.id = :id")
    Optional<Student> findByIdWithRates(@Param("id") Long id);

    // ✅ НОВЫЙ МЕТОД: загрузка всех студентов репетитора с rates
    @Query("SELECT DISTINCT s FROM Student s " +
            "JOIN s.tutors t " +
            "LEFT JOIN FETCH s.rates r " +
            "LEFT JOIN FETCH r.tutor rt " +
            "WHERE t.id = :tutorId")
    List<Student> findByTutorIdWithRates(@Param("tutorId") Long tutorId);

    // ✅ НОВЫЙ МЕТОД: загрузка студентов родителя с rates
    @Query("SELECT DISTINCT s FROM Student s " +
            "LEFT JOIN FETCH s.rates r " +
            "LEFT JOIN FETCH r.tutor " +
            "WHERE s.parent.id = :parentId")
    List<Student> findByParentIdWithRates(@Param("parentId") Long parentId);

    // ✅ Подсчёт студентов репетитора (без загрузки данных)
    @Query("SELECT COUNT(DISTINCT s) FROM Student s JOIN s.tutors t WHERE t.id = :tutorId")
    long countByTutorId(@Param("tutorId") Long tutorId);
}