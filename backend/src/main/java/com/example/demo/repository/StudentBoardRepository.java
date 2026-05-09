package com.example.demo.repository;

import com.example.demo.entity.StudentBoard;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface StudentBoardRepository extends JpaRepository<StudentBoard, Long> {
    Optional<StudentBoard> findByStudentIdAndTutorId(Long studentId, Long tutorId);
}