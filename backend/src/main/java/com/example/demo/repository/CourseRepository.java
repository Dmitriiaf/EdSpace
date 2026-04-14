package com.example.demo.repository;

import com.example.demo.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    List<Course> findByTutorId(Long tutorId);

    @Query("SELECT DISTINCT c FROM Course c LEFT JOIN FETCH c.enrolledStudents WHERE c.id = :id")
    Optional<Course> findByIdWithStudents(@Param("id") Long id);

    @Query("SELECT c FROM Course c WHERE c.tutor.id = :tutorId AND c.name = :name")
    Optional<Course> findByTutorIdAndName(@Param("tutorId") Long tutorId, @Param("name") String name);

    @Query("SELECT c FROM Course c JOIN c.enrolledStudents s WHERE s.id = :studentId")
    List<Course> findCoursesByStudentId(@Param("studentId") Long studentId);
}