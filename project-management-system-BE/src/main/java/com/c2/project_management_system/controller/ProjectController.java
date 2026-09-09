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
import org.springframework.web.bind.annotation.RestController;

import com.c2.project_management_system.dto.request.ProjectCreateRequest;
import com.c2.project_management_system.dto.request.ProjectUpdateRequest;
import com.c2.project_management_system.dto.respone.MessageResponse;
import com.c2.project_management_system.dto.respone.ProjectResponse;
import com.c2.project_management_system.entity.User;
import com.c2.project_management_system.service.ProjectService;

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
		return ResponseEntity.ok(projectService.updateProject(projectId, currentUser.getId(), request));
	}

	@PostMapping("/{projectId}/close")
	public ResponseEntity<ProjectResponse> closeProject(@PathVariable Long projectId, Authentication authentication) {
		User currentUser = currentUser(authentication);
		return ResponseEntity.ok(projectService.closeProject(projectId, currentUser.getId()));
	}

	@DeleteMapping("/{projectId}")
	public ResponseEntity<MessageResponse> deleteProject(@PathVariable Long projectId, Authentication authentication) {
		User currentUser = currentUser(authentication);
		boolean isAdmin = authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority)
				.anyMatch(a -> a.equals("ROLE_ADMIN"));

		projectService.deleteProject(projectId, currentUser.getId(), isAdmin);
		return ResponseEntity.ok(MessageResponse.builder().message("Xoa du an thanh cong").build());
	}

	@GetMapping("/{projectId}")
	public ResponseEntity<ProjectResponse> getProjectById(@PathVariable Long projectId) {
		return ResponseEntity.ok(projectService.getProjectById(projectId));
	}

	@GetMapping
	public ResponseEntity<List<ProjectResponse>> getAllProjects() {
		return ResponseEntity.ok(projectService.getAllProjects());
	}

	private User currentUser(Authentication authentication) {
		return (User) authentication.getPrincipal();
	}

}
