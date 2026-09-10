package com.c2.project_management_system.dto.respone;

import java.time.LocalDateTime;
import com.c2.project_management_system.statusEnum.NotificationTargetType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {
    private Long id; // recipient id
    private Long notificationId;
    private String title;
    private String content;
    private NotificationTargetType targetType;
    private Boolean isRead;
    private LocalDateTime readAt;
    private Long createdById;
    private String createdByName;
    private LocalDateTime createdAt;
}