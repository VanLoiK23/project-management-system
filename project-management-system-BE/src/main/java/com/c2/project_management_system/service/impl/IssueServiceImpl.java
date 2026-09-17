package com.c2.project_management_system.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.c2.project_management_system.dto.request.IssueAssignRequest;
import com.c2.project_management_system.dto.request.IssueCommentRequest;
import com.c2.project_management_system.dto.request.IssueCreateRequest;
import com.c2.project_management_system.dto.request.IssueSeverityUpdateRequest;
import com.c2.project_management_system.dto.request.IssueStatusUpdateRequest;
import com.c2.project_management_system.dto.respone.CloudinaryFile;
import com.c2.project_management_system.dto.respone.IssueAttachmentResponse;
import com.c2.project_management_system.dto.respone.IssueCommentResponse;
import com.c2.project_management_system.dto.respone.IssuePageResponse;
import com.c2.project_management_system.dto.respone.IssueResponse;
import com.c2.project_management_system.dto.respone.IssueStatsResponse;
import com.c2.project_management_system.dto.respone.PageResponse;
import com.c2.project_management_system.entity.Issue;
import com.c2.project_management_system.entity.IssueAttachment;
import com.c2.project_management_system.entity.IssueComment;
import com.c2.project_management_system.entity.Project;
import com.c2.project_management_system.entity.User;
import com.c2.project_management_system.exception.InvalidOperationException;
import com.c2.project_management_system.exception.ResourceNotFoundException;
import com.c2.project_management_system.repository.IssueAttachmentRepository;
import com.c2.project_management_system.repository.IssueCommentRepository;
import com.c2.project_management_system.repository.IssueRepository;
import com.c2.project_management_system.repository.ProjectRepository;
import com.c2.project_management_system.repository.UserRepository;
import com.c2.project_management_system.service.FileStorageService;
import com.c2.project_management_system.service.IssueService;
import com.c2.project_management_system.statusEnum.IssueSeverity;
import com.c2.project_management_system.statusEnum.IssueStatus;
import com.c2.project_management_system.statusEnum.ProjectStatus;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class IssueServiceImpl implements IssueService {

	private final IssueRepository issueRepository;
	private final IssueCommentRepository issueCommentRepository;
	private final ProjectRepository projectRepository;
	private final UserRepository userRepository;
	private final IssueAttachmentRepository issueAttachmentRepository;
	private final FileStorageService fileStorageService;

	@Override
	@Transactional
	public IssueResponse reportIssue(Long reporterId, IssueCreateRequest request) {

		Project project = projectRepository.findById(request.getProjectId())
				.orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dự án id=" + request.getProjectId()));

		User reporter = userRepository.findById(reporterId)
				.orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người báo cáo id=" + reporterId));

		Issue issue = Issue.builder().title(request.getTitle().trim()).description(request.getDescription())
				.severity(request.getSeverity()).status(IssueStatus.NEW).project(project).reporter(reporter).build();

		Issue saved = issueRepository.save(issue);

		log.info("Tạo Issue id={} projectId={} reporterId={}", saved.getId(), project.getId(), reporterId);

		return toResponse(saved);
	}

	@Override
	@Transactional
	public IssueResponse assignIssue(Long issueId, Long currentUserId, IssueAssignRequest request) {

		Issue issue = getIssueOrThrow(issueId);

		checkCanManageIssue(issue, currentUserId);

		if (request.getAssigneeId() == null) {
			issue.setAssignee(null);

			return toResponse(issueRepository.save(issue));
		}

		User assignee = userRepository.findById(request.getAssigneeId()).orElseThrow(
				() -> new ResourceNotFoundException("Không tìm thấy người dùng id=" + request.getAssigneeId()));

		validateUserBelongsToProject(assignee, issue.getProject());

		issue.setAssignee(assignee);

		if (issue.getStatus() == IssueStatus.NEW) {
			issue.setStatus(IssueStatus.IN_PROGRESS);
		}

		return toResponse(issueRepository.save(issue));
	}

	@Override
	@Transactional
	public IssueResponse updateStatus(Long issueId, Long currentUserId, IssueStatusUpdateRequest request) {

		Issue issue = getIssueOrThrow(issueId);

		checkCanManageIssue(issue, currentUserId);

		validateStatusTransition(issue.getStatus(), request.getStatus());

		issue.setStatus(request.getStatus());

		return toResponse(issueRepository.save(issue));
	}

	@Override
	@Transactional
	public IssueResponse updateSeverity(Long issueId, Long currentUserId, IssueSeverityUpdateRequest request) {

		Issue issue = getIssueOrThrow(issueId);

		checkCanManageIssue(issue, currentUserId);

		issue.setSeverity(request.getSeverity());

		return toResponse(issueRepository.save(issue));
	}

	@Override
	@Transactional
	public IssueCommentResponse addComment(Long issueId, Long authorId, IssueCommentRequest request) {

		Issue issue = getIssueOrThrow(issueId);

		validateUserCanViewIssue(issue, authorId);

		User author = userRepository.findById(authorId)
				.orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng id=" + authorId));

		IssueComment comment = IssueComment.builder().content(request.getContent().trim()).issue(issue).author(author)
				.build();

		IssueComment saved = issueCommentRepository.save(comment);

		return toCommentResponse(saved);
	}

	@Override
	@Transactional(readOnly = true)
	public List<IssueCommentResponse> getComments(Long issueId) {

		Issue issue = getIssueOrThrow(issueId);

		return issueCommentRepository.findByIssueOrderByCreatedAtAsc(issue).stream().map(this::toCommentResponse)
				.collect(Collectors.toList());
	}

	@Override
	@Transactional(readOnly = true)
	public IssueResponse getIssueById(Long issueId) {

		return toResponse(getIssueOrThrow(issueId));
	}

	@Override
	@Transactional(readOnly = true)
	public PageResponse<IssueResponse> getIssuesByProject(Long projectId, int page, int size, String keyword,
			IssueStatus status, IssueSeverity severity, Long assigneeId, String sortBy, String direction) {

		if (!projectRepository.existsById(projectId)) {
			throw new ResourceNotFoundException("Không tìm thấy dự án id=" + projectId);
		}

		Sort.Direction sortDirection = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;

		Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

		Page<Issue> issuePage = issueRepository.findProjectIssues(projectId, normalizeKeyword(keyword), status,
				severity, assigneeId, pageable);

		List<IssueResponse> content = issuePage.getContent().stream().map(this::toResponse)
				.collect(Collectors.toList());

		return PageResponse.<IssueResponse>builder().content(content).page(issuePage.getNumber())
				.size(issuePage.getSize()).totalElements(issuePage.getTotalElements())
				.totalPages(issuePage.getTotalPages()).build();
	}

	@Override
	@Transactional(readOnly = true)
	public IssueStatsResponse getProjectIssueStats(Long projectId) {

		if (!projectRepository.existsById(projectId)) {
			throw new ResourceNotFoundException("Không tìm thấy dự án id=" + projectId);
		}

		long total = issueRepository.countByProjectId(projectId);

		long newCount = issueRepository.countByProjectIdAndStatus(projectId, IssueStatus.NEW);

		long inProgress = issueRepository.countByProjectIdAndStatus(projectId, IssueStatus.IN_PROGRESS);

		long critical = issueRepository.countByProjectIdAndSeverity(projectId, IssueSeverity.CRITICAL);

		return IssueStatsResponse.builder().total(total).newCount(newCount).inProgress(inProgress).critical(critical)
				.build();
	}

	@Override
	@Transactional(readOnly = true)
	public List<IssueResponse> searchIssues(String keyword) {

		if (keyword == null || keyword.isBlank()) {
			return List.of();
		}

		return issueRepository.findByTitleContainingIgnoreCase(keyword.trim()).stream().map(this::toResponse)
				.collect(Collectors.toList());
	}

	@Override
	@Transactional
	public IssueResponse reportIssue(Long reporterId, IssueCreateRequest request, List<MultipartFile> images) {

		Project project = projectRepository.findById(request.getProjectId())
				.orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dự án id=" + request.getProjectId()));

		User reporter = userRepository.findById(reporterId)
				.orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người báo cáo id=" + reporterId));

		validateMemberCanReport(project, reporterId);

		if (project.getStatus() == ProjectStatus.CLOSED || project.getStatus() == ProjectStatus.CANCELLED) {

			throw new InvalidOperationException("Không thể báo cáo Issue trong dự án đã đóng hoặc đã hủy");
		}

		if (images != null && images.size() > 5) {
			throw new InvalidOperationException("Mỗi Issue chỉ được tải tối đa 5 ảnh");
		}

		Issue issue = Issue.builder().title(request.getTitle().trim())
				.description(request.getDescription() == null ? null : request.getDescription().trim())
				.severity(request.getSeverity()).status(IssueStatus.NEW).project(project).reporter(reporter).build();

		Issue saved = issueRepository.save(issue);

		if (images != null) {

			for (MultipartFile image : images) {

				if (image == null || image.isEmpty()) {
					continue;
				}

				CloudinaryFile uploaded = fileStorageService.uploadIssueImage(saved.getId(), image);

				IssueAttachment attachment = IssueAttachment.builder().fileName(uploaded.getFileName())
						.fileUrl(uploaded.getFileUrl()).publicId(uploaded.getPublicId()).issue(saved)
						.uploadedBy(reporter).build();

				issueAttachmentRepository.save(attachment);
			}
		}

		log.info("Tạo Issue id={} projectId={} reporterId={}", saved.getId(), project.getId(), reporterId);

		return toResponse(saved, reporterId);
	}

	private void validateMemberCanReport(Long projectId, Long userId) {

		Project project = projectRepository.findById(projectId)
				.orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dự án"));

		validateMemberCanReport(project, userId);
	}

	private void validateMemberCanReport(Project project, Long userId) {

		boolean belongs = project.getMembers().stream().anyMatch(member -> member.getUser().getId().equals(userId));

		if (!belongs) {
			throw new org.springframework.security.access.AccessDeniedException("Bạn không phải thành viên của dự án");
		}
	}

	private Issue getIssueOrThrow(Long issueId) {

		return issueRepository.findById(issueId)
				.orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vấn đề/lỗi id=" + issueId));
	}

	private String normalizeKeyword(String keyword) {

		if (keyword == null || keyword.isBlank()) {
			return null;
		}

		return keyword.trim();
	}

	private void validateUserBelongsToProject(User user, Project project) {

		boolean belongs = project.getMembers().stream()
				.anyMatch(member -> member.getUser().getId().equals(user.getId()));

		if (!belongs) {
			throw new IllegalArgumentException("Người dùng không thuộc dự án");
		}
	}

	private void checkCanManageIssue(Issue issue, Long currentUserId) {

		Long projectManagerId = issue.getProject().getProjectManager().getId();

		if (!projectManagerId.equals(currentUserId)) {
			throw new org.springframework.security.access.AccessDeniedException(
					"Chỉ Project Manager mới có quyền quản lý Issue");
		}
	}

	private void validateStatusTransition(IssueStatus current, IssueStatus next) {

		if (current == next) {
			return;
		}

		boolean valid = switch (current) {

		case NEW -> next == IssueStatus.IN_PROGRESS || next == IssueStatus.REJECTED;

		case IN_PROGRESS -> next == IssueStatus.FIXED || next == IssueStatus.REJECTED;

		case FIXED -> next == IssueStatus.CLOSED || next == IssueStatus.IN_PROGRESS;

		case CLOSED -> false;

		case REJECTED -> false;
		};

		if (!valid) {
			throw new IllegalArgumentException("Không thể chuyển trạng thái từ " + current + " sang " + next);
		}
	}

	private IssueResponse toResponse(Issue issue) {

		return IssueResponse.builder().id(issue.getId()).title(issue.getTitle()).description(issue.getDescription())
				.severity(issue.getSeverity()).status(issue.getStatus()).projectId(issue.getProject().getId())
				.reporterId(issue.getReporter().getId()).reporterName(issue.getReporter().getFullName())
				.assigneeId(issue.getAssignee() != null ? issue.getAssignee().getId() : null)
				.assigneeName(issue.getAssignee() != null ? issue.getAssignee().getFullName() : null)
				.createdAt(issue.getCreatedAt()).updatedAt(issue.getUpdatedAt()).build();
	}

	private IssueCommentResponse toCommentResponse(IssueComment comment) {

		return IssueCommentResponse.builder().id(comment.getId()).content(comment.getContent())
				.authorId(comment.getAuthor().getId()).authorName(comment.getAuthor().getFullName())
				.createdAt(comment.getCreatedAt()).build();
	}

	@Override
	@Transactional(readOnly = true)
	public IssuePageResponse getMyIssues(Long currentUserId, Long projectId, int page, int size, String keyword,
			IssueStatus status, IssueSeverity severity, String sortBy, String direction) {

		Project project = projectRepository.findById(projectId)
				.orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dự án id=" + projectId));

		validateMemberCanReport(project, currentUserId);

		if (page < 0) {
			page = 0;
		}

		if (size < 1) {
			size = 10;
		}

		if (size > 100) {
			size = 100;
		}

		List<String> allowedSortFields = List.of("id", "title", "severity", "status", "createdAt", "updatedAt");

		if (!allowedSortFields.contains(sortBy)) {
			sortBy = "createdAt";
		}

		Sort.Direction sortDirection = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;

		Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

		Page<Issue> issuePage = issueRepository.findMyIssues(projectId, currentUserId, normalizeKeyword(keyword),
				status, severity, pageable);

		List<IssueResponse> content = issuePage.getContent().stream().map(issue -> toResponse(issue, currentUserId))
				.collect(Collectors.toList());

		IssueStatsResponse statistics = buildMyIssueStatistics(projectId, currentUserId);

		return IssuePageResponse.builder().content(content).page(issuePage.getNumber()).size(issuePage.getSize())
				.totalElements(issuePage.getTotalElements()).totalPages(issuePage.getTotalPages())
				.statistics(statistics).build();
	}

	@Override
	@Transactional(readOnly = true)
	public IssueResponse getMyIssueById(Long issueId, Long currentUserId) {

		Issue issue = getIssueOrThrow(issueId);

		validateUserCanViewIssue(issue, currentUserId);

		return toResponse(issue, currentUserId);
	}

	@Override
	@Transactional
	public IssueResponse updateMemberStatus(Long issueId, Long currentUserId, IssueStatusUpdateRequest request) {

		Issue issue = getIssueOrThrow(issueId);

		if (issue.getAssignee() == null || !issue.getAssignee().getId().equals(currentUserId)) {

			throw new AccessDeniedException("Bạn chỉ được cập nhật trạng thái Issue được phân công cho mình");
		}

		Project project = issue.getProject();

		if (project.getStatus() == ProjectStatus.CLOSED || project.getStatus() == ProjectStatus.CANCELLED) {

			throw new InvalidOperationException("Không thể cập nhật Issue của dự án đã đóng hoặc đã hủy");
		}

		IssueStatus current = issue.getStatus();
		IssueStatus next = request.getStatus();

		validateMemberStatusTransition(current, next);

		issue.setStatus(next);

		Issue saved = issueRepository.save(issue);

		return toResponse(saved, currentUserId);
	}

	private IssueStatsResponse buildMyIssueStatistics(Long projectId, Long userId) {

		long total = issueRepository.countMyIssues(projectId, userId);

		long newCount = issueRepository.countMyIssuesByStatus(projectId, userId, IssueStatus.NEW);

		long inProgress = issueRepository.countMyIssuesByStatus(projectId, userId, IssueStatus.IN_PROGRESS);

		long fixed = issueRepository.countMyIssuesByStatus(projectId, userId, IssueStatus.FIXED);

		long critical = issueRepository.countMyIssuesBySeverity(projectId, userId, IssueSeverity.CRITICAL);

		return IssueStatsResponse.builder().total(total).newCount(newCount).inProgress(inProgress).fixed(fixed)
				.critical(critical).build();
	}

	private void validateMemberStatusTransition(IssueStatus current, IssueStatus next) {

		if (current == next) {
			return;
		}

		boolean valid = switch (current) {

		case NEW -> next == IssueStatus.IN_PROGRESS;

		case IN_PROGRESS -> next == IssueStatus.FIXED;

		case FIXED, CLOSED, REJECTED -> false;
		};

		if (!valid) {
			throw new IllegalArgumentException("Member không thể chuyển trạng thái từ " + current + " sang " + next);
		}
	}

	private IssueResponse toResponse(Issue issue, Long currentUserId) {

		boolean canUpdateStatus = issue.getAssignee() != null && issue.getAssignee().getId().equals(currentUserId)
				&& issue.getStatus() != IssueStatus.FIXED && issue.getStatus() != IssueStatus.CLOSED
				&& issue.getStatus() != IssueStatus.REJECTED;

		List<IssueAttachmentResponse> attachments = issueAttachmentRepository.findByIssueOrderByUploadedAtAsc(issue)
				.stream()
				.map(attachment -> IssueAttachmentResponse.builder().id(attachment.getId())
						.fileName(attachment.getFileName()).fileUrl(attachment.getFileUrl())
						.uploadedAt(attachment.getUploadedAt()).uploadedBy(attachment.getUploadedBy().getId())
						.uploadedByName(attachment.getUploadedBy().getFullName()).build())
				.collect(Collectors.toList());

		return IssueResponse.builder().id(issue.getId()).title(issue.getTitle()).description(issue.getDescription())
				.severity(issue.getSeverity()).status(issue.getStatus()).projectId(issue.getProject().getId())
				.reporterId(issue.getReporter().getId()).reporterName(issue.getReporter().getFullName())
				.assigneeId(issue.getAssignee() != null ? issue.getAssignee().getId() : null)
				.assigneeName(issue.getAssignee() != null ? issue.getAssignee().getFullName() : null)
				.attachments(attachments).canUpdateStatus(canUpdateStatus).createdAt(issue.getCreatedAt())
				.updatedAt(issue.getUpdatedAt()).build();
	}

	private void validateUserCanViewIssue(Issue issue, Long userId) {

		boolean reporter = issue.getReporter() != null && issue.getReporter().getId().equals(userId);

		boolean assignee = issue.getAssignee() != null && issue.getAssignee().getId().equals(userId);

		boolean projectManager = issue.getProject().getProjectManager().getId().equals(userId);

		if (!reporter && !assignee && !projectManager) {

			throw new AccessDeniedException("Bạn không có quyền truy cập Issue này");
		}
	}
}