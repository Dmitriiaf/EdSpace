package com.example.demo.repository;

import com.example.demo.entity.StudentStepikCourse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentStepikCourseRepository extends JpaRepository<StudentStepikCourse, Long> {

    List<StudentStepikCourse> findByStudentId(Long studentId);

    List<StudentStepikCourse> findByAssignedById(Long tutorId);

    Optional<StudentStepikCourse> findByStudentIdAndCourseId(Long studentId, Long courseId);

    boolean existsByStudentIdAndCourseId(Long studentId, Long courseId);
}