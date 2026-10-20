package com.example.demo.repository;

import com.example.demo.entity.StudentCosmetic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentCosmeticRepository extends JpaRepository<StudentCosmetic, Long> {

    List<StudentCosmetic> findByStudentIdOrderByPurchasedAtDesc(Long studentId);

    List<StudentCosmetic> findByStudentIdAndItemType(Long studentId, String itemType);

    Optional<StudentCosmetic> findByStudentIdAndItemTypeAndItemKey(Long studentId, String itemType, String itemKey);

    List<StudentCosmetic> findByStudentIdAndActiveTrue(Long studentId);
}