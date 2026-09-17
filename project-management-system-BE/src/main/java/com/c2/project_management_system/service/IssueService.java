package com.c2.project_management_system.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.c2.project_management_system.dto.request.IssueAssignRequest;
import com.c2.project_management_system.dto.request.IssueCommentRequest;
import com.c2.project_management_system.dto.request.IssueCreateRequest;
import com.c2.project_management_system.dto.request.IssueSeverityUpdateRequest;
import com.c2.project_management_system.dto.request.IssueStatusUpdateRequest;
import com.c2.project_management_system.dto.respone.IssueCommentResponse;
import com.c2.project_management_system.dto.respone.IssuePageResponse;
import com.c2.project_management_system.dto.respone.IssueResponse;
import com.c2.project_management_system.dto.respone.IssueStatsResponse;
import com.c2.project_management_system.dto.respone.PageResponse;
import com.c2.project_management_system.statusEnum.IssueSeverity;
import com.c2.project_management_system.statusEnum.IssueStatus;

public interface IssueService {

	IssueResponse reportIssue(Long reporterId, IssueCreateRequest request);

	IssueResponse assignIssue(Long issueId, Long currentUserId, IssueAssignRequest request);

	IssueResponse updateStatus(Long issueId, Long currentUserId, IssueStatusUpdateRequest request);

	IssueResponse updateSeverity(Long issueId, Long currentUserId, IssueSeverityUpdateRequest request);

	IssueCommentResponse addComment(Long issueId, Long authorId, IssueCommentRequest request);

	List<IssueCommentResponse> getComments(Long issueId);

	IssueResponse getIssueById(Long issueId);

	PageResponse<IssueResponse> getIssuesByProject(Long projectId, int page, int size, String keyword,
			IssueStatus status, IssueSeverity severity, Long assigneeId, String sortBy, String direction);

	IssueStatsResponse getProjectIssueStats(Long projectId);

	List<IssueResponse> searchIssues(String keyword);

	IssuePageResponse getMyIssues(Long currentUserId, Long projectId, int page, int size, String keyword,
			IssueStatus status, IssueSeverity severity, String sortBy, String direction);

	IssueResponse getMyIssueById(Long issueId, Long currentUserId);

	IssueResponse reportIssue(Long reporterId, IssueCreateRequest request, List<MultipartFile> images);

	IssueResponse updateMemberStatus(Long issueId, Long currentUserId, IssueStatusUpdateRequest request);
}