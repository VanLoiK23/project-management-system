package com.c2.project_management_system.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

import com.c2.project_management_system.dto.request.ProjectCreateRequest;
import com.c2.project_management_system.dto.request.ProjectUpdateRequest;
import com.c2.project_management_system.dto.respone.MessageResponse;
import com.c2.project_management_system.dto.respone.PageResponse;
import com.c2.project_management_system.dto.respone.ProjectResponse;
import com.c2.project_management_system.entity.User;
import com.c2.project_management_system.service.ProjectService;
import com.c2.project_management_system.statusEnum.ProjectStatus;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

	private final ProjectService projectService;

	@PostMapping
	public ResponseEntity<ProjectResponse> createProject(Authentication authentication,
			@Valid @RequestBody ProjectCreateRequest request) {

		User currentUser = currentUser(authentication);

		ProjectResponse response = projectService.createProject(currentUser.getId(), request);

		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

	@PutMapping("/{projectId}")
	public ResponseEntity<ProjectResponse> updateProject(@PathVariable Long projectId, Authentication authentication,
			@Valid @RequestBody ProjectUpdateRequest request) {

		User currentUser = currentUser(authentication);

		boolean isAdmin = authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority)
				.anyMatch("ROLE_ADMIN"::equals);

		return ResponseEntity.ok(projectService.updateProject(projectId, currentUser.getId(), request, isAdmin));
	}

	@PostMapping("/{projectId}/close")
	public ResponseEntity<ProjectResponse> closeProject(@PathVariable Long projectId, Authentication authentication) {

		User currentUser = currentUser(authentication);

		boolean isAdmin = authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority)
				.anyMatch("ROLE_ADMIN"::equals);

		return ResponseEntity.ok(projectService.closeProject(projectId, currentUser.getId(), isAdmin));
	}

	@DeleteMapping("/{projectId}")
	public ResponseEntity<MessageResponse> deleteProject(@PathVariable Long projectId, Authentication authentication) {

		User currentUser = currentUser(authentication);

		boolean isAdmin = authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority)
				.anyMatch("ROLE_ADMIN"::equals);

		projectService.deleteProject(projectId, currentUser.getId(), isAdmin);

		return ResponseEntity.ok(MessageResponse.builder().message("Xóa dự án thành công").build());
	}

	@GetMapping("/{projectId}")
	public ResponseEntity<ProjectResponse> getProjectById(@PathVariable Long projectId, Authentication authentication) {

		User currentUser = currentUser(authentication);

		boolean isAdmin = authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority)
				.anyMatch(a -> a.equals("ROLE_ADMIN"));

		return ResponseEntity.ok(projectService.getProjectById(projectId, currentUser.getId(), isAdmin));
	}

	@GetMapping
	public ResponseEntity<List<ProjectResponse>> getAllProjects(Authentication authentication) {

		User currentUser = currentUser(authentication);

		boolean isAdmin = authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority)
				.anyMatch(a -> a.equals("ROLE_ADMIN"));

		return ResponseEntity.ok(projectService.getProjectsForUser(currentUser.getId(), isAdmin));
	}

	@PreAuthorize("hasRole('ADMIN')")
	@GetMapping("/admin")
	public ResponseEntity<PageResponse<ProjectResponse>> getAdminProjects(Authentication authentication,

			@RequestParam(defaultValue = "0") int page,

			@RequestParam(defaultValue = "10") int size,

			@RequestParam(required = false) String keyword,

			@RequestParam(required = false) ProjectStatus status,

			@RequestParam(required = false) Long projectManagerId,

			@RequestParam(required = false) LocalDate startDateFrom,

			@RequestParam(required = false) LocalDate startDateTo,

			@RequestParam(defaultValue = "createdAt") String sortBy,

			@RequestParam(defaultValue = "desc") String direction) {

		boolean isAdmin = authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority)
				.anyMatch("ROLE_ADMIN"::equals);

		if (!isAdmin) {
			throw new SecurityException("Chỉ Admin mới có quyền xem toàn bộ dự án");
		}

		if (page < 0) {
			page = 0;
		}

		if (size <= 0) {
			size = 10;
		}

		if (size > 100) {
			size = 100;
		}

		List<String> allowedSortFields = List.of("id", "name", "startDate", "endDate", "status", "createdAt",
				"updatedAt");

		if (!allowedSortFields.contains(sortBy)) {
			sortBy = "createdAt";
		}

		Sort.Direction sortDirection = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;

		Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

		PageResponse<ProjectResponse> response = projectService.getAdminProjects(keyword, status, projectManagerId,
				startDateFrom, startDateTo, pageable);

		return ResponseEntity.ok(response);
	}

	@GetMapping("/member")
	public ResponseEntity<PageResponse<ProjectResponse>> getMemberProjects(Authentication authentication,
			@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "6") int size,
			@RequestParam(required = false) String keyword, @RequestParam(required = false) String status,
			@RequestParam(required = false) String role, @RequestParam(defaultValue = "createdAt") String sortBy,
			@RequestParam(defaultValue = "desc") String direction) {

		User currentUser = currentUser(authentication);

		PageResponse<ProjectResponse> response = projectService.getMemberProjects(currentUser.getId(), page, size,
				keyword, status, role, sortBy, direction);

		return ResponseEntity.ok(response);
	}

	private User currentUser(Authentication authentication) {

		if (authentication == null || authentication.getPrincipal() == null) {

			throw new IllegalArgumentException("Không xác định được người dùng hiện tại");
		}

		return (User) authentication.getPrincipal();
	}
}