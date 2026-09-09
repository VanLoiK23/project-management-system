package com.c2.project_management_system.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.c2.project_management_system.entity.Document;
import com.c2.project_management_system.entity.DocumentPermission;
import com.c2.project_management_system.entity.User;
import com.c2.project_management_system.statusEnum.DocumentPermissionType;

@Repository
public interface DocumentPermissionRepository extends JpaRepository<DocumentPermission, Long> {

    List<DocumentPermission> findByDocument(Document document);

    List<DocumentPermission> findByDocumentAndUser(Document document, User user);

    boolean existsByDocumentAndUserAndPermissionType(
            Document document, User user, DocumentPermissionType permissionType);
}
