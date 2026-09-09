package com.c2.project_management_system.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.c2.project_management_system.entity.Issue;
import com.c2.project_management_system.entity.Project;
import com.c2.project_management_system.entity.User;
import com.c2.project_management_system.statusEnum.IssueSeverity;
import com.c2.project_management_system.statusEnum.IssueStatus;

@Repository
public interface IssueRepository extends JpaRepository<Issue, Long> {

    List<Issue> findByProject(Project project);

    List<Issue> findByProjectAndStatus(Project project, IssueStatus status);

    List<Issue> findByProjectAndSeverity(Project project, IssueSeverity severity);

    List<Issue> findByAssignee(User assignee);

    List<Issue> findByReporter(User reporter);

    List<Issue> findByTitleContainingIgnoreCase(String keyword);
}
