package com.c2.project_management_system.service;

import java.util.List;

import com.c2.project_management_system.dto.request.NotificationSettingRequest;
import com.c2.project_management_system.dto.respone.NotificationResponse;
import com.c2.project_management_system.dto.respone.NotificationSettingResponse;
import com.c2.project_management_system.statusEnum.NotificationTargetType;

public interface NotificationService {
    List<NotificationResponse> getUserNotifications(Long userId);
    long getUnreadCount(Long userId);
    void markAsRead(Long recipientId, Long userId);
    void markAllAsRead(Long userId);
    NotificationSettingResponse getSettings(Long userId);
    NotificationSettingResponse updateSettings(Long userId, NotificationSettingRequest request);
    void sendNotificationToProject(Long projectId, Long senderId, String title, String content, NotificationTargetType targetType);
}