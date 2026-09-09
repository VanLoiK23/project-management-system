package com.c2.project_management_system.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.c2.project_management_system.entity.Document;
import com.c2.project_management_system.entity.Project;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findByProject(Project project);

    List<Document> findByProjectAndNameContainingIgnoreCase(Project project, String keyword);
}
