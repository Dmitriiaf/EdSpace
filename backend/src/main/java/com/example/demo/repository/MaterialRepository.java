package com.example.demo.repository;

import com.example.demo.entity.Material;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Long> {

    List<Material> findByTutorId(Long tutorId);

    List<Material> findByTutorIdAndStudentId(Long tutorId, Long studentId);

    List<Material> findByTutorIdAndCourseId(Long tutorId, Long courseId);

    List<Material> findByFolderId(Long folderId);

    @Query("SELECT m FROM Material m WHERE m.tutor.id = :tutorId AND m.folder IS NULL")
    List<Material> findRootMaterials(@Param("tutorId") Long tutorId);
}