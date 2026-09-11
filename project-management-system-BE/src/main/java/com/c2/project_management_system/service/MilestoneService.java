package com.c2.project_management_system.service;

import java.util.List;

import com.c2.project_management_system.dto.request.MilestoneCreateRequest;
import com.c2.project_management_system.dto.request.MilestoneUpdateRequest;
import com.c2.project_management_system.dto.respone.MilestoneResponse;

public interface MilestoneService {
    MilestoneResponse createMilestone(Long currentUserId, MilestoneCreateRequest request);
    MilestoneResponse updateMilestone(Long milestoneId, MilestoneUpdateRequest request);
    void deleteMilestone(Long milestoneId);
    MilestoneResponse getMilestoneById(Long milestoneId);
    List<MilestoneResponse> getMilestonesByProject(Long projectId);
}