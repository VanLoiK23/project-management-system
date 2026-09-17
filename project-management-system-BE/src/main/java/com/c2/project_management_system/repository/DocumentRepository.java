package com.c2.project_management_system.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.c2.project_management_system.entity.Document;
import com.c2.project_management_system.entity.Project;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findByProjectOrderByUpdatedAtDesc(Project project);

    List<Document> findByProjectIdOrderByUpdatedAtDesc(Long projectId);

    List<Document> findByProjectIdAndFolderIdOrderByUpdatedAtDesc(
            Long projectId,
            Long folderId
    );

    List<Document> findByProjectIdAndFolderIsNullOrderByUpdatedAtDesc(
            Long projectId
    );
}