package com.c2.project_management_system.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.c2.project_management_system.entity.Project;
import com.c2.project_management_system.entity.Task;
import com.c2.project_management_system.entity.User;
import com.c2.project_management_system.statusEnum.TaskPriority;
import com.c2.project_management_system.statusEnum.TaskStatus;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

	List<Task> findByProject(Project project);

	List<Task> findByProjectAndStatus(Project project, TaskStatus status);

	List<Task> findByProjectAndPriority(Project project, TaskPriority priority);

	List<Task> findByAssigneesContaining(User user);

	List<Task> findByTitleContainingIgnoreCase(String keyword);

	List<Task> findByProjectId(Long projectId);

	@Query("""
			SELECT DISTINCT t
			FROM Task t
			LEFT JOIN t.assignees a
			WHERE t.project.id = :projectId
			  AND (
			        :keyword IS NULL
			        OR :keyword = ''
			        OR LOWER(t.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
			        OR LOWER(COALESCE(t.description, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
			  )
			  AND (
			        :status IS NULL
			        OR t.status = :status
			  )
			  AND (
			        :priority IS NULL
			        OR t.priority = :priority
			  )
			  AND (
			        :assigneeId IS NULL
			        OR a.id = :assigneeId
			  )
			""")
	Page<Task> findProjectTasks(@Param("projectId") Long projectId, @Param("keyword") String keyword,
			@Param("status") TaskStatus status, @Param("priority") TaskPriority priority,
			@Param("assigneeId") Long assigneeId, Pageable pageable);

	long countByProjectId(Long projectId);

	long countByProjectIdAndStatus(Long projectId, TaskStatus status);

	@Query("""
			SELECT COUNT(t)
			FROM Task t
			WHERE t.project.id = :projectId
			  AND t.status NOT IN :statuses
			""")
	long countUnfinishedTasks(@Param("projectId") Long projectId, @Param("statuses") List<TaskStatus> statuses);

	@Query("""
			SELECT COALESCE(AVG(t.progressPercent), 0)
			FROM Task t
			WHERE t.project.id = :projectId
			""")
	Double calculateAverageProgress(@Param("projectId") Long projectId);

	@Query("""
			SELECT COUNT(t)
			FROM Task t
			WHERE t.project.id = :projectId
			  AND t.status <> :completed
			  AND t.status <> :cancelled
			""")
	long countUnfinishedTasks(@Param("projectId") Long projectId, @Param("completed") TaskStatus completed,
			@Param("cancelled") TaskStatus cancelled);

	@Query("""
			    SELECT DISTINCT t
			    FROM Task t
			    JOIN t.assignees a
			    WHERE a.id = :userId
			      AND (
			            :keyword IS NULL
			            OR :keyword = ''
			            OR LOWER(t.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
			            OR LOWER(t.description) LIKE LOWER(CONCAT('%', :keyword, '%'))
			      )
			      AND (
			            :status IS NULL
			            OR t.status = :status
			      )
			      AND (
			            :priority IS NULL
			            OR t.priority = :priority
			      )
			""")
	Page<Task> findMyTasks(@Param("userId") Long userId, @Param("keyword") String keyword,
			@Param("status") TaskStatus status, @Param("priority") TaskPriority priority, Pageable pageable);

	@Query("""
			    SELECT DISTINCT t
			    FROM Task t
			    JOIN t.assignees a
			    WHERE a.id = :userId
			      AND t.project.id = :projectId
			""")
	List<Task> findMyTasksFromProject(@Param("userId") Long userId, @Param("projectId") Long projectId);

	@Query("""
			    SELECT COUNT(t)
			    FROM Task t
			    JOIN t.assignees a
			    WHERE a.id = :userId
			""")
	long countMyTasks(@Param("userId") Long userId);

	@Query("""
			    SELECT COUNT(t)
			    FROM Task t
			    JOIN t.assignees a
			    WHERE a.id = :userId
			      AND t.status = :status
			""")
	long countMyTasksByStatus(@Param("userId") Long userId, @Param("status") TaskStatus status);

	@Query("""
			    SELECT COUNT(t)
			    FROM Task t
			    JOIN t.assignees a
			    WHERE a.id = :userId
			      AND t.status NOT IN :statuses
			""")
	long countMyUnfinishedTasks(@Param("userId") Long userId, @Param("statuses") List<TaskStatus> statuses);

	@Query("""
			    SELECT AVG(t.progressPercent)
			    FROM Task t
			    JOIN t.assignees a
			    WHERE a.id = :userId
			""")
	Double calculateMyAverageProgress(@Param("userId") Long userId);
}
