package com.c2.project_management_system.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.c2.project_management_system.entity.Project;
import com.c2.project_management_system.entity.User;
import com.c2.project_management_system.statusEnum.ProjectStatus;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long>,JpaSpecificationExecutor<Project> {

	Optional<Project> findByName(String name);

	boolean existsByNameIgnoreCaseAndProjectManager_Id(String name, Long projectManagerId);

	List<Project> findByStatus(ProjectStatus status);

	List<Project> findByProjectManager(User projectManager);

	List<Project> findByNameContainingIgnoreCase(String keyword);

	boolean existsByNameIgnoreCase(String name);

	@Query("""
			    SELECT DISTINCT p
			    FROM Project p
			    LEFT JOIN ProjectMember pm
			        ON pm.project = p
			    WHERE p.projectManager.id = :userId
			       OR pm.user.id = :userId
			""")
	List<Project> findProjectsForUser(@Param("userId") Long userId);
}
