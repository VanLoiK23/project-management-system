package com.c2.project_management_system.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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
    public ResponseEntity<MilestoneResponse> create(Authentication authentication,
            @Valid @RequestBody MilestoneCreateRequest request) {
        User currentUser = currentUser(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(milestoneService.createMilestone(currentUser.getId(), request));
    }

    @PutMapping("/{milestoneId}")
    public ResponseEntity<MilestoneResponse> update(@PathVariable Long milestoneId,
            @Valid @RequestBody MilestoneUpdateRequest request) {
        return ResponseEntity.ok(milestoneService.updateMilestone(milestoneId, request));
    }

    @DeleteMapping("/{milestoneId}")
    public ResponseEntity<MessageResponse> delete(@PathVariable Long milestoneId) {
        milestoneService.deleteMilestone(milestoneId);
        return ResponseEntity.ok(MessageResponse.builder().message("Xóa lịch trình thành công").build());
    }

    @GetMapping("/{milestoneId}")
    public ResponseEntity<MilestoneResponse> getById(@PathVariable Long milestoneId) {
        return ResponseEntity.ok(milestoneService.getMilestoneById(milestoneId));
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<MilestoneResponse>> getByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(milestoneService.getMilestonesByProject(projectId));
    }

    private User currentUser(Authentication authentication) {
        return (User) authentication.getPrincipal();
    }
}