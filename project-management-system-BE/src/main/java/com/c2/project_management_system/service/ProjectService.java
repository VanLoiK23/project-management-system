package com.c2.project_management_system.service;

import java.util.List;

import com.c2.project_management_system.dto.request.ProjectCreateRequest;
import com.c2.project_management_system.dto.request.ProjectUpdateRequest;
import com.c2.project_management_system.dto.respone.ProjectResponse;


public interface ProjectService {

    ProjectResponse createProject(Long currentUserId, ProjectCreateRequest request);

    ProjectResponse updateProject(Long projectId, Long currentUserId, ProjectUpdateRequest request);

    ProjectResponse closeProject(Long projectId, Long currentUserId);

    void deleteProject(Long projectId, Long currentUserId, boolean currentUserIsAdmin);

    ProjectResponse getProjectById(Long projectId);

    List<ProjectResponse> getAllProjects();
}
