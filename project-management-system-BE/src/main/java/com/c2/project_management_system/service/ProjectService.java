package com.c2.project_management_system.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Pageable;

import com.c2.project_management_system.dto.request.ProjectCreateRequest;
import com.c2.project_management_system.dto.request.ProjectUpdateRequest;
import com.c2.project_management_system.dto.respone.PageResponse;
import com.c2.project_management_system.dto.respone.ProjectResponse;
import com.c2.project_management_system.statusEnum.ProjectMemberRole;
import com.c2.project_management_system.statusEnum.ProjectStatus;

public interface ProjectService {

	ProjectResponse createProject(Long currentUserId, ProjectCreateRequest request);

	ProjectResponse updateProject(Long projectId, Long currentUserId, ProjectUpdateRequest request, boolean isAdmin);

	ProjectResponse closeProject(Long projectId, Long currentUserId, boolean isAdmin);

	void deleteProject(Long projectId, Long currentUserId, boolean currentUserIsAdmin);

	ProjectResponse getProjectById(Long projectId);

	ProjectResponse getProjectById(Long projectId, Long userId, boolean isAdmin);

	List<ProjectResponse> getAllProjects();

	List<ProjectResponse> getProjectsForUser(Long userId, boolean isAdmin);

	PageResponse<ProjectResponse> getAdminProjects(String keyword, ProjectStatus status, Long projectManagerId,
			LocalDate startDateFrom, LocalDate startDateTo, Pageable pageable);

	PageResponse<ProjectResponse> getMemberProjects(Long userId, int page, int size, String keyword, String status,
			String role, String sortBy, String direction);
}
