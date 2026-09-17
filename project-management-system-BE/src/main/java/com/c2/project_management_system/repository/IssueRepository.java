package com.c2.project_management_system.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.c2.project_management_system.entity.Issue;
import com.c2.project_management_system.entity.Project;
import com.c2.project_management_system.entity.User;
import com.c2.project_management_system.statusEnum.IssueSeverity;
import com.c2.project_management_system.statusEnum.IssueStatus;

@Repository
public interface IssueRepository extends JpaRepository<Issue, Long> {

	List<Issue> findByAssignee(User assignee);

	List<Issue> findByReporter(User reporter);

	List<Issue> findByProject(Project project);

	List<Issue> findByProjectAndStatus(Project project, IssueStatus status);

	List<Issue> findByProjectAndSeverity(Project project, IssueSeverity severity);

	List<Issue> findByTitleContainingIgnoreCase(String keyword);

	@Query("""
			SELECT DISTINCT i
			FROM Issue i
			LEFT JOIN i.assignee a
			WHERE i.project.id = :projectId

			AND (
			    :keyword IS NULL
			    OR :keyword = ''
			    OR LOWER(i.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
			    OR LOWER(COALESCE(i.description, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
			)

			AND (
			    :status IS NULL
			    OR i.status = :status
			)

			AND (
			    :severity IS NULL
			    OR i.severity = :severity
			)

			AND (
			    :assigneeId IS NULL
			    OR a.id = :assigneeId
			)
			""")
	Page<Issue> findProjectIssues(@Param("projectId") Long projectId, @Param("keyword") String keyword,
			@Param("status") IssueStatus status, @Param("severity") IssueSeverity severity,
			@Param("assigneeId") Long assigneeId, Pageable pageable);

	long countByProjectId(Long projectId);

	long countByProjectIdAndStatus(Long projectId, IssueStatus status);

	long countByProjectIdAndSeverity(Long projectId, IssueSeverity severity);

	@Query("""
			    SELECT DISTINCT i
			    FROM Issue i
			    LEFT JOIN i.assignee a
			    WHERE i.project.id = :projectId
			      AND (
			            i.reporter.id = :userId
			            OR a.id = :userId
			      )
			      AND (
			            :keyword IS NULL
			            OR :keyword = ''
			            OR LOWER(i.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
			            OR LOWER(i.description) LIKE LOWER(CONCAT('%', :keyword, '%'))
			      )
			      AND (
			            :status IS NULL
			            OR i.status = :status
			      )
			      AND (
			            :severity IS NULL
			            OR i.severity = :severity
			      )
			""")
	Page<Issue> findMyIssues(@Param("projectId") Long projectId, @Param("userId") Long userId,
			@Param("keyword") String keyword, @Param("status") IssueStatus status,
			@Param("severity") IssueSeverity severity, Pageable pageable);

	@Query("""
			    SELECT COUNT(i)
			    FROM Issue i
			    LEFT JOIN i.assignee a
			    WHERE i.project.id = :projectId
			      AND (
			            i.reporter.id = :userId
			            OR a.id = :userId
			      )
			""")
	long countMyIssues(@Param("projectId") Long projectId, @Param("userId") Long userId);

	@Query("""
			    SELECT COUNT(i)
			    FROM Issue i
			    LEFT JOIN i.assignee a
			    WHERE i.project.id = :projectId
			      AND (
			            i.reporter.id = :userId
			            OR a.id = :userId
			      )
			      AND i.status = :status
			""")
	long countMyIssuesByStatus(@Param("projectId") Long projectId, @Param("userId") Long userId,
			@Param("status") IssueStatus status);

	@Query("""
			    SELECT COUNT(i)
			    FROM Issue i
			    LEFT JOIN i.assignee a
			    WHERE i.project.id = :projectId
			      AND (
			            i.reporter.id = :userId
			            OR a.id = :userId
			      )
			      AND i.severity = :severity
			""")
	long countMyIssuesBySeverity(@Param("projectId") Long projectId, @Param("userId") Long userId,
			@Param("severity") IssueSeverity severity);
}
