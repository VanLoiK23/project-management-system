package com.c2.project_management_system.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.c2.project_management_system.dto.request.ProjectMemberAddRequest;
import com.c2.project_management_system.dto.request.ProjectMemberUpdateRoleRequest;
import com.c2.project_management_system.dto.respone.MessageResponse;
import com.c2.project_management_system.dto.respone.PageResponse;
import com.c2.project_management_system.dto.respone.ProjectMemberResponse;
import com.c2.project_management_system.entity.User;
import com.c2.project_management_system.service.ProjectMemberService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/projects/{projectId}/members")
@RequiredArgsConstructor
public class ProjectMemberController {

	private final ProjectMemberService projectMemberService;

	@PostMapping
	public ResponseEntity<ProjectMemberResponse> addMember(@PathVariable Long projectId,
			@Valid @RequestBody ProjectMemberAddRequest request) {

		ProjectMemberResponse response = projectMemberService.addMember(projectId, request);

		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

	@PutMapping("/{userId}/role")
	public ResponseEntity<ProjectMemberResponse> updateMemberRole(@PathVariable Long projectId,
			@PathVariable Long userId, @Valid @RequestBody ProjectMemberUpdateRoleRequest request) {

		return ResponseEntity.ok(projectMemberService.updateMemberRole(projectId, userId, request));
	}

	@DeleteMapping("/{userId}")
	public ResponseEntity<MessageResponse> removeMember(@PathVariable Long projectId, @PathVariable Long userId) {

		projectMemberService.removeMember(projectId, userId);

		return ResponseEntity.ok(MessageResponse.builder().message("Xóa thành viên thành công").build());
	}

	@GetMapping
	public ResponseEntity<List<ProjectMemberResponse>> getMembers(@PathVariable Long projectId) {

		return ResponseEntity.ok(projectMemberService.getMembers(projectId));
	}

	@GetMapping("/pagination")
	public ResponseEntity<PageResponse<ProjectMemberResponse>> getMembers(@PathVariable Long projectId,

			@RequestParam(defaultValue = "0") int page,

			@RequestParam(defaultValue = "10") int size,

			@RequestParam(required = false) String keyword,

			@RequestParam(required = false) String role,

			@RequestParam(required = false) String status,

			@RequestParam(defaultValue = "joinedAt") String sortBy,

			@RequestParam(defaultValue = "desc") String direction, Authentication authentication) {

		User currentUser = currentUser(authentication);

		boolean isAdmin = authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority)
				.anyMatch("ROLE_ADMIN"::equals);

		return ResponseEntity.ok(projectMemberService.getMembersPagination(projectId, page, size, keyword, role, status,
				sortBy, direction, currentUser.getId(), isAdmin));
	}

	private User currentUser(Authentication authentication) {

		if (authentication == null || authentication.getPrincipal() == null) {

			throw new IllegalArgumentException("Không xác định được người dùng hiện tại");
		}

		return (User) authentication.getPrincipal();
	}
}