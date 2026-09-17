package com.c2.project_management_system.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
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
import com.c2.project_management_system.entity.User;
import com.c2.project_management_system.service.IssueService;
import com.c2.project_management_system.statusEnum.IssueSeverity;
import com.c2.project_management_system.statusEnum.IssueStatus;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/issues")
@RequiredArgsConstructor
public class IssueController {

	private final IssueService issueService;

	@PostMapping
	public ResponseEntity<IssueResponse> report(Authentication authentication,
			@Valid @RequestBody IssueCreateRequest request) {

		User currentUser = currentUser(authentication);

		return ResponseEntity.status(HttpStatus.CREATED).body(issueService.reportIssue(currentUser.getId(), request));
	}

	@PostMapping("/{issueId}/assign")
	public ResponseEntity<IssueResponse> assign(@PathVariable Long issueId, Authentication authentication,
			@Valid @RequestBody IssueAssignRequest request) {

		User currentUser = currentUser(authentication);

		return ResponseEntity.ok(issueService.assignIssue(issueId, currentUser.getId(), request));
	}

	@PatchMapping("/{issueId}/status")
	public ResponseEntity<IssueResponse> updateStatus(@PathVariable Long issueId, Authentication authentication,
			@Valid @RequestBody IssueStatusUpdateRequest request) {

		User currentUser = currentUser(authentication);

		return ResponseEntity.ok(issueService.updateStatus(issueId, currentUser.getId(), request));
	}

	@PatchMapping("/{issueId}/severity")
	public ResponseEntity<IssueResponse> updateSeverity(@PathVariable Long issueId, Authentication authentication,
			@Valid @RequestBody IssueSeverityUpdateRequest request) {

		User currentUser = currentUser(authentication);

		return ResponseEntity.ok(issueService.updateSeverity(issueId, currentUser.getId(), request));
	}

	@PostMapping("/{issueId}/comments")
	public ResponseEntity<IssueCommentResponse> addComment(@PathVariable Long issueId, Authentication authentication,
			@Valid @RequestBody IssueCommentRequest request) {

		User currentUser = currentUser(authentication);

		return ResponseEntity.status(HttpStatus.CREATED)
				.body(issueService.addComment(issueId, currentUser.getId(), request));
	}

	@GetMapping("/{issueId}/comments")
	public ResponseEntity<List<IssueCommentResponse>> getComments(@PathVariable Long issueId) {

		return ResponseEntity.ok(issueService.getComments(issueId));
	}

	@GetMapping("/{issueId}")
	public ResponseEntity<IssueResponse> getById(@PathVariable Long issueId) {

		return ResponseEntity.ok(issueService.getIssueById(issueId));
	}

	@GetMapping("/project/{projectId}")
	public ResponseEntity<PageResponse<IssueResponse>> getByProject(@PathVariable Long projectId,
			@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size,
			@RequestParam(required = false) String keyword, @RequestParam(required = false) IssueStatus status,
			@RequestParam(required = false) IssueSeverity severity, @RequestParam(required = false) Long assigneeId,
			@RequestParam(defaultValue = "createdAt") String sortBy,
			@RequestParam(defaultValue = "desc") String direction) {

		if (page < 0) {
			page = 0;
		}

		if (size <= 0) {
			size = 10;
		}

		if (size > 100) {
			size = 100;
		}

		List<String> allowedSortFields = List.of("id", "title", "severity", "status", "createdAt", "updatedAt");

		if (!allowedSortFields.contains(sortBy)) {
			sortBy = "createdAt";
		}

		return ResponseEntity.ok(issueService.getIssuesByProject(projectId, page, size, keyword, status, severity,
				assigneeId, sortBy, direction));
	}

	@GetMapping("/project/{projectId}/stats")
	public ResponseEntity<IssueStatsResponse> getStats(@PathVariable Long projectId) {

		return ResponseEntity.ok(issueService.getProjectIssueStats(projectId));
	}

	@GetMapping("/search")
	public ResponseEntity<List<IssueResponse>> search(@RequestParam String keyword) {

		return ResponseEntity.ok(issueService.searchIssues(keyword));
	}

	@PostMapping(value = "/member", consumes = "multipart/form-data")
	public ResponseEntity<IssueResponse> memberReport(Authentication authentication, @RequestParam Long projectId,
			@RequestParam String title, @RequestParam(required = false) String description,
			@RequestParam IssueSeverity severity,
			@RequestPart(value = "images", required = false) List<MultipartFile> images) {

		User currentUser = currentUser(authentication);

		IssueCreateRequest request = new IssueCreateRequest();
		request.setProjectId(projectId);
		request.setTitle(title);
		request.setDescription(description);
		request.setSeverity(severity);

		return ResponseEntity.status(HttpStatus.CREATED)
				.body(issueService.reportIssue(currentUser.getId(), request, images));
	}

	@GetMapping("/member/project/{projectId}")
	public ResponseEntity<IssuePageResponse> getMyIssues(Authentication authentication, @PathVariable Long projectId,
			@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size,
			@RequestParam(required = false) String keyword, @RequestParam(required = false) IssueStatus status,
			@RequestParam(required = false) IssueSeverity severity,
			@RequestParam(defaultValue = "createdAt") String sortBy,
			@RequestParam(defaultValue = "desc") String direction) {

		User currentUser = currentUser(authentication);

		return ResponseEntity.ok(issueService.getMyIssues(currentUser.getId(), projectId, page, size, keyword, status,
				severity, sortBy, direction));
	}

	@PutMapping("/member/{issueId}/status")
	public ResponseEntity<IssueResponse> updateMemberStatus(@PathVariable Long issueId, Authentication authentication,
			@Valid @RequestBody IssueStatusUpdateRequest request) {

		User currentUser = currentUser(authentication);

		return ResponseEntity.ok(issueService.updateMemberStatus(issueId, currentUser.getId(), request));
	}

	@GetMapping("/member/{issueId}")
	public ResponseEntity<IssueResponse> getMemberIssue(@PathVariable Long issueId, Authentication authentication) {

		User currentUser = currentUser(authentication);

		return ResponseEntity.ok(issueService.getMyIssueById(issueId, currentUser.getId()));
	}


	private User currentUser(Authentication authentication) {

		if (authentication == null || authentication.getPrincipal() == null) {
			throw new IllegalArgumentException("Không xác định được người dùng hiện tại");
		}

		return (User) authentication.getPrincipal();
	}
}