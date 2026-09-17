package com.c2.project_management_system.service;

import java.util.List;
import java.util.Set;

import com.c2.project_management_system.dto.request.MilestoneCreateRequest;
import com.c2.project_management_system.dto.request.MilestoneUpdateRequest;
import com.c2.project_management_system.dto.respone.MilestoneResponse;
import com.c2.project_management_system.entity.Milestone;

public interface MilestoneService {

	MilestoneResponse createMilestone(Long currentUserId, MilestoneCreateRequest request);

	MilestoneResponse updateMilestone(Long milestoneId, Long currentUserId, MilestoneUpdateRequest request,
			boolean isAdmin);

	void deleteMilestone(Long milestoneId, Long currentUserId, boolean isAdmin);

	MilestoneResponse getMilestoneById(Long milestoneId, Long currentUserId, boolean isAdmin);

	List<MilestoneResponse> getMilestonesByProject(Long projectId, Long currentUserId, boolean isAdmin);
	
	void recalculateMilestones(Set<Milestone> milestones);

	void recalculateByTask(Long taskId);
}