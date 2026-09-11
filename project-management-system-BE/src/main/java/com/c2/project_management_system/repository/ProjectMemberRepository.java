package com.c2.project_management_system.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.c2.project_management_system.entity.Project;
import com.c2.project_management_system.entity.ProjectMember;
import com.c2.project_management_system.entity.User;
import com.c2.project_management_system.statusEnum.AccountStatus;
import com.c2.project_management_system.statusEnum.ProjectMemberRole;
import com.c2.project_management_system.statusEnum.ProjectStatus;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {

	List<ProjectMember> findByProject(Project project);

	List<ProjectMember> findByUser(User user);

	Optional<ProjectMember> findByProjectAndUser(Project project, User user);

	boolean existsByProjectAndUser(Project project, User user);

	void deleteByProjectAndUser(Project project, User user);

	@Query("""
			    SELECT pm
			    FROM ProjectMember pm
			    JOIN pm.user u
			    WHERE pm.project.id = :projectId

			    AND (
			        :keyword IS NULL
			        OR :keyword = ''
			        OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
			        OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
			    )

			    AND (
			        :role IS NULL
			        OR pm.projectRole  = :role
			    )

			    AND (
			        :status IS NULL
			        OR u.status = :status
			    )
			""")
	Page<ProjectMember> searchMembers(@Param("projectId") Long projectId, @Param("keyword") String keyword,
			@Param("role") ProjectMemberRole role, @Param("status") AccountStatus status, Pageable pageable);

	@Query(value = """
			SELECT pm
			FROM ProjectMember pm
			JOIN FETCH pm.project p
			JOIN FETCH pm.user u
			WHERE u.id = :userId
			  AND (
				  :keyword IS NULL
				  OR :keyword = ''
				  OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
				  OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%'))
			  )
			  AND (:status IS NULL OR p.status = :status)
			  AND (:role IS NULL OR pm.projectRole = :role)
			""", countQuery = """
			SELECT COUNT(pm)
			FROM ProjectMember pm
			WHERE pm.user.id = :userId
			  AND (:status IS NULL OR pm.project.status = :status)
			  AND (:role IS NULL OR pm.projectRole = :role)
			""")
	Page<ProjectMember> findMemberProjects(@Param("userId") Long userId, @Param("keyword") String keyword,
			@Param("status") ProjectStatus status, @Param("role") ProjectMemberRole role, Pageable pageable);

	Optional<ProjectMember> findByProjectIdAndUserId(Long projectId, Long userId);

	boolean existsByProjectIdAndUserId(Long projectId, Long userId);

	boolean existsByUser_Id(Long userId);
}
