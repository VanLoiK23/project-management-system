package com.c2.project_management_system.service;

import java.util.List;

import com.c2.project_management_system.dto.request.ProjectMemberAddRequest;
import com.c2.project_management_system.dto.request.ProjectMemberUpdateRoleRequest;
import com.c2.project_management_system.dto.respone.PageResponse;
import com.c2.project_management_system.dto.respone.ProjectMemberResponse;

public interface ProjectMemberService {

	ProjectMemberResponse addMember(Long projectId, ProjectMemberAddRequest request);

	ProjectMemberResponse updateMemberRole(Long projectId, Long userId, ProjectMemberUpdateRoleRequest request);

	void removeMember(Long projectId, Long userId);

	List<ProjectMemberResponse> getMembers(Long projectId);

	PageResponse<ProjectMemberResponse> getMembersPagination(Long projectId, int page, int size, String keyword,
			String role, String status, String sortBy, String direction, Long currentUserId, boolean isAdmin);
}
