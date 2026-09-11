package com.c2.project_management_system.service.impl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.c2.project_management_system.dto.request.NotificationSettingRequest;
import com.c2.project_management_system.dto.respone.NotificationResponse;
import com.c2.project_management_system.dto.respone.NotificationSettingResponse;
import com.c2.project_management_system.entity.*;
import com.c2.project_management_system.exception.ResourceNotFoundException;
import com.c2.project_management_system.repository.*;
import com.c2.project_management_system.service.NotificationService;
import com.c2.project_management_system.statusEnum.NotificationTargetType;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationRecipientRepository recipientRepository;
    private final NotificationSettingRepository settingRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getUserNotifications(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng id=" + userId));

        List<NotificationRecipient> recipients = recipientRepository.findByUserOrderByNotification_CreatedAtDesc(user);

        return recipients.stream()
                .filter(r -> r.getNotification() != null && !Boolean.TRUE.equals(r.getNotification().getHidden()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng id=" + userId));
        return recipientRepository.countByUserAndIsReadFalse(user);
    }

    @Override
    @Transactional
    public void markAsRead(Long recipientId, Long userId) {
        NotificationRecipient recipient = recipientRepository.findById(recipientId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo id=" + recipientId));

        if (!recipient.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Thông báo không thuộc về người dùng này");
        }

        recipient.setIsRead(true);
        recipient.setReadAt(LocalDateTime.now());
        recipientRepository.save(recipient);
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng id=" + userId));

        List<NotificationRecipient> unreadList = recipientRepository.findByUserAndIsReadFalse(user);
        LocalDateTime now = LocalDateTime.now();
        for (NotificationRecipient r : unreadList) {
            r.setIsRead(true);
            r.setReadAt(now);
        }
        recipientRepository.saveAll(unreadList);
    }

    @Override
    @Transactional
    public NotificationSettingResponse getSettings(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng id=" + userId));

        NotificationSetting setting = settingRepository.findByUser(user).orElseGet(() -> {
            NotificationSetting newSetting = NotificationSetting.builder()
                    .user(user)
                    .appEnabled(true)
                    .emailEnabled(true)
                    .smsEnabled(false)
                    .build();
            return settingRepository.save(newSetting);
        });

        return NotificationSettingResponse.builder()
                .id(setting.getId())
                .appEnabled(setting.getAppEnabled())
                .emailEnabled(setting.getEmailEnabled())
                .smsEnabled(setting.getSmsEnabled())
                .build();
    }

    @Override
    @Transactional
    public NotificationSettingResponse updateSettings(Long userId, NotificationSettingRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng id=" + userId));

        NotificationSetting setting = settingRepository.findByUser(user).orElseGet(() ->
            NotificationSetting.builder().user(user).build()
        );

        if (request.getAppEnabled() != null) setting.setAppEnabled(request.getAppEnabled());
        if (request.getEmailEnabled() != null) setting.setEmailEnabled(request.getEmailEnabled());
        if (request.getSmsEnabled() != null) setting.setSmsEnabled(request.getSmsEnabled());

        NotificationSetting saved = settingRepository.save(setting);

        return NotificationSettingResponse.builder()
                .id(saved.getId())
                .appEnabled(saved.getAppEnabled())
                .emailEnabled(saved.getEmailEnabled())
                .smsEnabled(saved.getSmsEnabled())
                .build();
    }

    @Override
    @Transactional
    public void sendNotificationToProject(Long projectId, Long senderId, String title, String content, NotificationTargetType targetType) {
        try {
            Project project = projectRepository.findById(projectId).orElse(null);
            if (project == null) return;

            User sender = userRepository.findById(senderId).orElse(null);
            if (sender == null) return;

            Notification notification = Notification.builder()
                    .title(title)
                    .content(content)
                    .targetType(targetType != null ? targetType : NotificationTargetType.GROUP)
                    .createdBy(sender)
                    .hidden(false)
                    .build();

            Notification savedNotification = notificationRepository.save(notification);

            Set<User> recipientsUsers = new HashSet<>();
            if (project.getProjectManager() != null) {
                recipientsUsers.add(project.getProjectManager());
            }
            List<ProjectMember> members = projectMemberRepository.findByProject(project);
            for (ProjectMember pm : members) {
                if (pm.getUser() != null) {
                    recipientsUsers.add(pm.getUser());
                }
            }

            List<NotificationRecipient> recipients = new ArrayList<>();
            for (User u : recipientsUsers) {
                // Kiểm tra setting của user nếu có
                NotificationRecipient nr = NotificationRecipient.builder()
                        .notification(savedNotification)
                        .user(u)
                        .isRead(false)
                        .build();
                recipients.add(nr);
            }

            recipientRepository.saveAll(recipients);
            log.info("Đã gửi thông báo '{}' tới {} thành viên trong dự án id={}", title, recipients.size(), projectId);
        } catch (Exception e) {
            log.warn("Lỗi khi gửi thông báo dự án (bỏ qua để không ảnh hưởng luồng chính): {}", e.getMessage());
        }
    }

    private NotificationResponse mapToResponse(NotificationRecipient r) {
        Notification n = r.getNotification();
        return NotificationResponse.builder()
                .id(r.getId())
                .notificationId(n.getId())
                .title(n.getTitle())
                .content(n.getContent())
                .targetType(n.getTargetType())
                .isRead(r.getIsRead())
                .readAt(r.getReadAt())
                .createdById(n.getCreatedBy() != null ? n.getCreatedBy().getId() : null)
                .createdByName(n.getCreatedBy() != null ? n.getCreatedBy().getFullName() : "Hệ thống")
                .createdAt(n.getCreatedAt())
                .build();
    }
}