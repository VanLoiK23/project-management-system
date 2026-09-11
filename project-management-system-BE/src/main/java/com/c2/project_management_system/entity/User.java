package com.c2.project_management_system.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.c2.project_management_system.statusEnum.AccountRole;
import com.c2.project_management_system.statusEnum.AccountStatus;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AccountRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private AccountStatus status = AccountStatus.ACTIVE;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // Bat buoc: phuc vu co che JWT refresh token
    @Builder.Default
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "user", orphanRemoval = true)
    private List<RefreshToken> refreshTokens = new ArrayList<>();

    // Cac du an ma user nay giu vai tro PM / nguoi tao
    @OneToMany(mappedBy = "projectManager")
    @Builder.Default
    private List<Project> managedProjects = new ArrayList<>();

    // Quan he n-n giua User va Project, co du lieu bo sung (vai tro trong du an) -> qua ProjectMember
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProjectMember> projectMemberships = new ArrayList<>();

    // Cac cong viec duoc phan cong (n-n voi Task, phia so huu quan he nam o Task)
    @ManyToMany(mappedBy = "assignees")
    @Builder.Default
    private Set<Task> assignedTasks = new HashSet<>();

    // Cac van de/loi do user nay bao cao
    @OneToMany(mappedBy = "reporter")
    @Builder.Default
    private List<Issue> reportedIssues = new ArrayList<>();

    // Cac van de/loi duoc phan cong xu ly
    @OneToMany(mappedBy = "assignee")
    @Builder.Default
    private List<Issue> assignedIssues = new ArrayList<>();

    // Cai dat nhan thong bao (1-1)
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private NotificationSetting notificationSetting;
}
