package com.c2.project_management_system.service.impl;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.c2.project_management_system.entity.Task;
import com.c2.project_management_system.entity.User;
import com.c2.project_management_system.repository.NotificationRecipientRepository;
import com.c2.project_management_system.repository.TaskRepository;
import com.c2.project_management_system.service.DeadlineReminderService;
import com.c2.project_management_system.service.NotificationService;
import com.c2.project_management_system.statusEnum.NotificationTargetType;
import com.c2.project_management_system.statusEnum.TaskStatus;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeadlineReminderServiceImpl implements DeadlineReminderService {

    private final TaskRepository taskRepository;
    private final NotificationService notificationService;
    private final NotificationRecipientRepository recipientRepository;

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @Override
    @Scheduled(cron = "0 0 8 * * ?") // 8h sáng mỗi ngày
    @Scheduled(fixedRate = 1800000)   // mỗi 30 phút kiểm tra
    @Transactional
    public int checkAndSendDeadlineReminders() {
        log.info("Bắt đầu quét và kiểm tra deadline công việc...");
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime next48h = now.plusHours(48);
        LocalDateTime sinceLast24h = now.minusHours(24);

        List<Task> allTasks = taskRepository.findAll();
        int sentCount = 0;

        for (Task task : allTasks) {
            if (task.getDeadline() == null) continue;
            if (task.getStatus() == TaskStatus.DONE || task.getStatus() == TaskStatus.CANCELLED) continue;

            LocalDateTime deadline = task.getDeadline();
            boolean isOverdue = deadline.isBefore(now);
            boolean isNearDeadline = !isOverdue && deadline.isBefore(next48h);

            if (!isOverdue && !isNearDeadline) continue;

            // Thu thập người nhận (assignees + PM nếu cần)
            Set<User> recipients = new HashSet<>(task.getAssignees());
            if (recipients.isEmpty() && task.getProject() != null && task.getProject().getProjectManager() != null) {
                recipients.add(task.getProject().getProjectManager());
            }

            if (recipients.isEmpty()) continue;

            String projectName = task.getProject() != null ? task.getProject().getName() : "Dự án";
            String formattedDeadline = deadline.format(DATE_TIME_FORMATTER);

            String title;
            String content;
            String reminderKeyword;

            if (isOverdue) {
                title = "[Cảnh báo quá hạn] " + task.getTitle();
                content = String.format("Công việc \"%s\" (ID: %d) thuộc dự án \"%s\" đã QUÁ HẠN chót (%s) nhưng chưa hoàn thành. Vui lòng cập nhật ngay!",
                        task.getTitle(), task.getId(), projectName, formattedDeadline);
                reminderKeyword = "ID: " + task.getId() + ") thuộc dự án";
            } else {
                title = "[Nhắc nhở hạn chót] " + task.getTitle();
                content = String.format("Công việc \"%s\" (ID: %d) thuộc dự án \"%s\" SẮP ĐẾN HẠN chót vào lúc %s. Hãy kiểm tra và hoàn thành đúng hạn!",
                        task.getTitle(), task.getId(), projectName, formattedDeadline);
                reminderKeyword = "ID: " + task.getId() + ") thuộc dự án";
            }

            Long senderId = (task.getProject() != null && task.getProject().getProjectManager() != null)
                    ? task.getProject().getProjectManager().getId()
                    : (task.getCreatedBy() != null ? task.getCreatedBy().getId() : null);

            for (User recipient : recipients) {
                boolean alreadyNotified = recipientRepository.existsRecentNotification(
                        recipient.getId(),
                        reminderKeyword,
                        sinceLast24h
                );

                if (!alreadyNotified) {
                    notificationService.sendNotificationToUser(
                            recipient.getId(),
                            senderId,
                            title,
                            content,
                            NotificationTargetType.INDIVIDUAL
                    );
                    sentCount++;
                }
            }
        }

        log.info("Hoàn tất quét deadline. Đã gửi {} thông báo nhắc hạn chót.", sentCount);
        return sentCount;
    }
}
