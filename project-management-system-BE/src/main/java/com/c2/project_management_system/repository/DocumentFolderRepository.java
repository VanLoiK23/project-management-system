package com.c2.project_management_system.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.c2.project_management_system.entity.DocumentFolder;

public interface DocumentFolderRepository extends JpaRepository<DocumentFolder, Long> {

	List<DocumentFolder> findByProjectIdOrderByNameAsc(Long projectId);

	List<DocumentFolder> findByProjectIdAndParentIsNullOrderByNameAsc(Long projectId);

	boolean existsByProjectIdAndNameAndParentId(Long projectId, String name, Long parentId);

	boolean existsByProjectIdAndNameAndParentIsNull(Long projectId, String name);
}