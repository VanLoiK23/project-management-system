package com.c2.project_management_system.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.c2.project_management_system.dto.request.ProjectMemberAddRequest;
import com.c2.project_management_system.dto.request.ProjectMemberUpdateRoleRequest;
import com.c2.project_management_system.dto.respone.MessageResponse;
import com.c2.project_management_system.dto.respone.ProjectMemberResponse;
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
		return ResponseEntity.ok(MessageResponse.builder().message("Xoa thanh vien thanh cong").build());
	}

	@GetMapping
	public ResponseEntity<List<ProjectMemberResponse>> getMembers(@PathVariable Long projectId) {
		return ResponseEntity.ok(projectMemberService.getMembers(projectId));
	}

}
