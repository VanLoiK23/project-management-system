package com.c2.project_management_system.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.c2.project_management_system.entity.Project;
import com.c2.project_management_system.entity.User;
import com.c2.project_management_system.statusEnum.ProjectStatus;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    Optional<Project> findByName(String name);

    boolean existsByName(String name);

    List<Project> findByStatus(ProjectStatus status);

    List<Project> findByProjectManager(User projectManager);

    List<Project> findByNameContainingIgnoreCase(String keyword);
}
