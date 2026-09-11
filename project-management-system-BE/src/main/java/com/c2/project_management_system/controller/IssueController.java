package com.c2.project_management_system.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.c2.project_management_system.dto.request.IssueAssignRequest;
import com.c2.project_management_system.dto.request.IssueCommentRequest;
import com.c2.project_management_system.dto.request.IssueCreateRequest;
import com.c2.project_management_system.dto.request.IssueSeverityUpdateRequest;
import com.c2.project_management_system.dto.request.IssueStatusUpdateRequest;
import com.c2.project_management_system.dto.respone.IssueCommentResponse;
import com.c2.project_management_system.dto.respone.IssueResponse;
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
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(issueService.reportIssue(currentUser.getId(), request));
    }

    @PostMapping("/{issueId}/assign")
    public ResponseEntity<IssueResponse> assign(@PathVariable Long issueId,
            @Valid @RequestBody IssueAssignRequest request) {
        return ResponseEntity.ok(issueService.assignIssue(issueId, request));
    }

    @PatchMapping("/{issueId}/status")
    public ResponseEntity<IssueResponse> updateStatus(@PathVariable Long issueId,
            @Valid @RequestBody IssueStatusUpdateRequest request) {
        return ResponseEntity.ok(issueService.updateStatus(issueId, request));
    }

    @PatchMapping("/{issueId}/severity")
    public ResponseEntity<IssueResponse> updateSeverity(@PathVariable Long issueId,
            @Valid @RequestBody IssueSeverityUpdateRequest request) {
        return ResponseEntity.ok(issueService.updateSeverity(issueId, request));
    }

    @PostMapping("/{issueId}/comments")
    public ResponseEntity<IssueCommentResponse> addComment(@PathVariable Long issueId,
            Authentication authentication, @Valid @RequestBody IssueCommentRequest request) {
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
    public ResponseEntity<List<IssueResponse>> getByProject(@PathVariable Long projectId,
            @RequestParam(required = false) IssueStatus status,
            @RequestParam(required = false) IssueSeverity severity) {
        return ResponseEntity.ok(issueService.getIssuesByProject(projectId, status, severity));
    }

    @GetMapping("/search")
    public ResponseEntity<List<IssueResponse>> search(@RequestParam String keyword) {
        return ResponseEntity.ok(issueService.searchIssues(keyword));
    }

    private User currentUser(Authentication authentication) {
        return (User) authentication.getPrincipal();
    }
}