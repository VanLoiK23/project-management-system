package com.c2.project_management_system.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.c2.project_management_system.dto.request.NotificationSettingRequest;
import com.c2.project_management_system.dto.respone.NotificationResponse;
import com.c2.project_management_system.dto.respone.NotificationSettingResponse;
import com.c2.project_management_system.entity.User;
import com.c2.project_management_system.service.NotificationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications(Authentication authentication) {
        User currentUser = currentUser(authentication);
        return ResponseEntity.ok(notificationService.getUserNotifications(currentUser.getId()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication authentication) {
        User currentUser = currentUser(authentication);
        long count = notificationService.getUnreadCount(currentUser.getId());
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    @PatchMapping("/{recipientId}/read")
    public ResponseEntity<Map<String, String>> markAsRead(
            Authentication authentication,
            @PathVariable Long recipientId) {
        User currentUser = currentUser(authentication);
        notificationService.markAsRead(recipientId, currentUser.getId());
        return ResponseEntity.ok(Map.of("message", "Đã đánh dấu đã đọc"));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllAsRead(Authentication authentication) {
        User currentUser = currentUser(authentication);
        notificationService.markAllAsRead(currentUser.getId());
        return ResponseEntity.ok(Map.of("message", "Đã đánh dấu tất cả đã đọc"));
    }

    @GetMapping("/settings")
    public ResponseEntity<NotificationSettingResponse> getSettings(Authentication authentication) {
        User currentUser = currentUser(authentication);
        return ResponseEntity.ok(notificationService.getSettings(currentUser.getId()));
    }

    @PutMapping("/settings")
    public ResponseEntity<NotificationSettingResponse> updateSettings(
            Authentication authentication,
            @RequestBody NotificationSettingRequest request) {
        User currentUser = currentUser(authentication);
        return ResponseEntity.ok(notificationService.updateSettings(currentUser.getId(), request));
    }

    private User currentUser(Authentication authentication) {
        return (User) authentication.getPrincipal();
    }
}