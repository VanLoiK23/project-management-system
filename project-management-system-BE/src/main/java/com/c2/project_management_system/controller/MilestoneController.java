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

import com.c2.project_management_system.dto.request.MilestoneCreateRequest;
import com.c2.project_management_system.dto.request.MilestoneUpdateRequest;
import com.c2.project_management_system.dto.respone.MessageResponse;
import com.c2.project_management_system.dto.respone.MilestoneResponse;
import com.c2.project_management_system.entity.User;
import com.c2.project_management_system.service.MilestoneService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/milestones")
@RequiredArgsConstructor
public class MilestoneController {

	private final MilestoneService milestoneService;

	@PostMapping
	public ResponseEntity<MilestoneResponse> createMilestone(Authentication authentication,
			@Valid @RequestBody MilestoneCreateRequest request) {

		User currentUser = currentUser(authentication);

		MilestoneResponse response = milestoneService.createMilestone(currentUser.getId(), request);

		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

	@PutMapping("/{milestoneId}")
	public ResponseEntity<MilestoneResponse> updateMilestone(@PathVariable Long milestoneId,
			Authentication authentication, @Valid @RequestBody MilestoneUpdateRequest request) {

		User currentUser = currentUser(authentication);

		boolean isAdmin = isAdmin(authentication);

		return ResponseEntity.ok(milestoneService.updateMilestone(milestoneId, currentUser.getId(), request, isAdmin));
	}

	@DeleteMapping("/{milestoneId}")
	public ResponseEntity<MessageResponse> deleteMilestone(@PathVariable Long milestoneId,
			Authentication authentication) {

		User currentUser = currentUser(authentication);

		boolean isAdmin = isAdmin(authentication);

		milestoneService.deleteMilestone(milestoneId, currentUser.getId(), isAdmin);

		return ResponseEntity.ok(MessageResponse.builder().message("Xóa Milestone thành công").build());
	}

	@GetMapping("/{milestoneId}")
	public ResponseEntity<MilestoneResponse> getMilestone(@PathVariable Long milestoneId,
			Authentication authentication) {

		User currentUser = currentUser(authentication);

		boolean isAdmin = isAdmin(authentication);

		return ResponseEntity.ok(milestoneService.getMilestoneById(milestoneId, currentUser.getId(), isAdmin));
	}

	@GetMapping("/project/{projectId}")
	public ResponseEntity<List<MilestoneResponse>> getProjectMilestones(@PathVariable Long projectId,
			Authentication authentication) {

		User currentUser = currentUser(authentication);

		boolean isAdmin = isAdmin(authentication);

		return ResponseEntity.ok(milestoneService.getMilestonesByProject(projectId, currentUser.getId(), isAdmin));
	}

	private User currentUser(Authentication authentication) {

		if (authentication == null || authentication.getPrincipal() == null) {

			throw new IllegalArgumentException("Không xác định được người dùng hiện tại");
		}

		return (User) authentication.getPrincipal();
	}

	private boolean isAdmin(Authentication authentication) {

		return authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority)
				.anyMatch("ROLE_ADMIN"::equals);
	}
}