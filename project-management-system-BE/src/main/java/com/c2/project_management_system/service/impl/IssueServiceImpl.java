package com.c2.project_management_system.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.c2.project_management_system.dto.request.*;
import com.c2.project_management_system.dto.respone.IssueCommentResponse;
import com.c2.project_management_system.dto.respone.IssueResponse;
import com.c2.project_management_system.entity.Issue;
import com.c2.project_management_system.entity.IssueComment;
import com.c2.project_management_system.entity.Project;
import com.c2.project_management_system.entity.User;
import com.c2.project_management_system.exception.ResourceNotFoundException;
import com.c2.project_management_system.repository.*;
import com.c2.project_management_system.service.IssueService;
import com.c2.project_management_system.statusEnum.IssueSeverity;
import com.c2.project_management_system.statusEnum.IssueStatus;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Trien khai nghiep vu Module 7 - Quan ly van de/loi.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class IssueServiceImpl implements IssueService {

    private final IssueRepository issueRepository;
    private final IssueCommentRepository issueCommentRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public IssueResponse reportIssue(Long reporterId, IssueCreateRequest request) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dự án id=" + request.getProjectId()));
        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người báo cáo id=" + reporterId));

        Issue issue = Issue.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .severity(request.getSeverity())
                .status(IssueStatus.NEW)
                .project(project)
                .reporter(reporter)
                .build();

        Issue saved = issueRepository.save(issue);
        log.info("Đã tạo vấn đề/lỗi '{}' (id={}) cho dự án id={} bởi user id={}",
                saved.getTitle(), saved.getId(), project.getId(), reporterId);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public IssueResponse assignIssue(Long issueId, IssueAssignRequest request) {
        Issue issue = getIssueOrThrow(issueId);
        User assignee = userRepository.findById(request.getAssigneeId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng id=" + request.getAssigneeId()));
        issue.setAssignee(assignee);
        Issue saved = issueRepository.save(issue);
        // TODO: bắn thông báo cho người được giao (phối hợp với module Thông báo của Bắc)
        return toResponse(saved);
    }

    @Override
    @Transactional
    public IssueResponse updateStatus(Long issueId, IssueStatusUpdateRequest request) {
        Issue issue = getIssueOrThrow(issueId);
        issue.setStatus(request.getStatus());
        return toResponse(issueRepository.save(issue));
    }

    @Override
    @Transactional
    public IssueResponse updateSeverity(Long issueId, IssueSeverityUpdateRequest request) {
        Issue issue = getIssueOrThrow(issueId);
        issue.setSeverity(request.getSeverity());
        return toResponse(issueRepository.save(issue));
    }

    @Override
    @Transactional
    public IssueCommentResponse addComment(Long issueId, Long authorId, IssueCommentRequest request) {
        Issue issue = getIssueOrThrow(issueId);
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng id=" + authorId));

        IssueComment comment = IssueComment.builder()
                .content(request.getContent())
                .issue(issue)
                .author(author)
                .build();

        IssueComment saved = issueCommentRepository.save(comment);
        return toCommentResponse(saved);
    }

    @Override
    public List<IssueCommentResponse> getComments(Long issueId) {
        Issue issue = getIssueOrThrow(issueId);
        return issueCommentRepository.findByIssueOrderByCreatedAtAsc(issue).stream()
                .map(this::toCommentResponse)
                .collect(Collectors.toList());
    }

    @Override
    public IssueResponse getIssueById(Long issueId) {
        return toResponse(getIssueOrThrow(issueId));
    }

    @Override
    public List<IssueResponse> getIssuesByProject(Long projectId, IssueStatus status, IssueSeverity severity) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dự án id=" + projectId));

        List<Issue> issues;
        if (status != null) {
            issues = issueRepository.findByProjectAndStatus(project, status);
        } else if (severity != null) {
            issues = issueRepository.findByProjectAndSeverity(project, severity);
        } else {
            issues = issueRepository.findByProject(project);
        }
        return issues.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<IssueResponse> searchIssues(String keyword) {
        return issueRepository.findByTitleContainingIgnoreCase(keyword).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private Issue getIssueOrThrow(Long id) {
        return issueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vấn đề/lỗi id=" + id));
    }

    private IssueResponse toResponse(Issue issue) {
        return IssueResponse.builder()
                .id(issue.getId())
                .title(issue.getTitle())
                .description(issue.getDescription())
                .severity(issue.getSeverity())
                .status(issue.getStatus())
                .projectId(issue.getProject().getId())
                .reporterId(issue.getReporter().getId())
                .reporterName(issue.getReporter().getFullName())
                .assigneeId(issue.getAssignee() != null ? issue.getAssignee().getId() : null)
                .assigneeName(issue.getAssignee() != null ? issue.getAssignee().getFullName() : null)
                .createdAt(issue.getCreatedAt())
                .updatedAt(issue.getUpdatedAt())
                .build();
    }

    private IssueCommentResponse toCommentResponse(IssueComment c) {
        return IssueCommentResponse.builder()
                .id(c.getId())
                .content(c.getContent())
                .authorId(c.getAuthor().getId())
                .authorName(c.getAuthor().getFullName())
                .createdAt(c.getCreatedAt())
                .build();
    }
}