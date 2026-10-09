package com.example.demo.repository;

import com.example.demo.entity.EgeChecklistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EgeChecklistItemRepository extends JpaRepository<EgeChecklistItem, Long> {

    List<EgeChecklistItem> findByChecklistIdOrderByTaskNumberAsc(Long checklistId);
}