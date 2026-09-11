package com.c2.project_management_system.service;

import java.util.List;

import com.c2.project_management_system.dto.request.IssueAssignRequest;
import com.c2.project_management_system.dto.request.IssueCommentRequest;
import com.c2.project_management_system.dto.request.IssueCreateRequest;
import com.c2.project_management_system.dto.request.IssueSeverityUpdateRequest;
import com.c2.project_management_system.dto.request.IssueStatusUpdateRequest;
import com.c2.project_management_system.dto.respone.IssueCommentResponse;
import com.c2.project_management_system.dto.respone.IssueResponse;
import com.c2.project_management_system.statusEnum.IssueSeverity;
import com.c2.project_management_system.statusEnum.IssueStatus;

public interface IssueService {
    IssueResponse reportIssue(Long reporterId, IssueCreateRequest request);
    IssueResponse assignIssue(Long issueId, IssueAssignRequest request);
    IssueResponse updateStatus(Long issueId, IssueStatusUpdateRequest request);
    IssueResponse updateSeverity(Long issueId, IssueSeverityUpdateRequest request);
    IssueCommentResponse addComment(Long issueId, Long authorId, IssueCommentRequest request);
    List<IssueCommentResponse> getComments(Long issueId);
    IssueResponse getIssueById(Long issueId);
    List<IssueResponse> getIssuesByProject(Long projectId, IssueStatus status, IssueSeverity severity);
    List<IssueResponse> searchIssues(String keyword);
}