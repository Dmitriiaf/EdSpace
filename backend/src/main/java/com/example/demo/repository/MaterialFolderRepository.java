package com.example.demo.repository;

import com.example.demo.entity.MaterialFolder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MaterialFolderRepository extends JpaRepository<MaterialFolder, Long> {

    List<MaterialFolder> findByTutorId(Long tutorId);

    List<MaterialFolder> findByTutorIdAndParentFolderIsNull(Long tutorId);

    List<MaterialFolder> findByParentFolderId(Long parentFolderId);
}