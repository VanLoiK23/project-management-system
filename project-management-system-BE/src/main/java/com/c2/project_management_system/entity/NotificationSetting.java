package com.c2.project_management_system.entity;

import jakarta.persistence.*;
import lombok.*;


@Entity
@Table(name = "notification_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    @Builder.Default
    private Boolean emailEnabled = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean appEnabled = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean smsEnabled = false;
}
