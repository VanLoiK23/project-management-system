package com.c2.project_management_system.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
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
}
