package com.c2.project_management_system.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.c2.project_management_system.entity.Notification;
import com.c2.project_management_system.entity.NotificationRecipient;
import com.c2.project_management_system.entity.User;

@Repository
public interface NotificationRecipientRepository extends JpaRepository<NotificationRecipient, Long> {

    List<NotificationRecipient> findByUserOrderByNotification_CreatedAtDesc(User user);

    List<NotificationRecipient> findByUserAndIsReadFalse(User user);

    long countByUserAndIsReadFalse(User user);

    List<NotificationRecipient> findByNotification(Notification notification);
}
