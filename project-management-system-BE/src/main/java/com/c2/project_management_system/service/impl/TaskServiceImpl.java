package com.c2.project_management_system.service.impl;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.c2.project_management_system.dto.request.CommentRequest;
import com.c2.project_management_system.dto.request.TaskRequest;
import com.c2.project_management_system.dto.request.UpdateAssigneesRequest;
import com.c2.project_management_system.dto.respone.TaskCommentResponse;
import com.c2.project_management_system.dto.respone.TaskResponse;
import com.c2.project_management_system.entity.Project;
import com.c2.project_management_system.entity.Task;
import com.c2.project_management_system.entity.User;
import com.c2.project_management_system.repository.ProjectRepository;
import com.c2.project_management_system.repository.TaskRepository;
import com.c2.project_management_system.repository.UserRepository;
import com.c2.project_management_system.service.TaskService;
import com.c2.project_management_system.statusEnum.TaskPriority;
import com.c2.project_management_system.statusEnum.TaskStatus;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;

    // =====================================================
    // GET TASKS CỦA USER
    // =====================================================

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksForCurrentUser() {

        User currentUser = getCurrentUser();

        List<Task> tasks =
                taskRepository.findByAssigneesContaining(currentUser);

        return tasks.stream()
                .map(this::toTaskResponse)
                .toList();
    }

    // =====================================================
    // GET TASKS THEO PROJECT
    // =====================================================

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByProject(Long projectId) {

        if (projectId == null) {
            throw new IllegalArgumentException(
                    "Project ID không được để trống");
        }

        projectRepository.findById(projectId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy dự án"));

        List<Task> tasks =
                taskRepository.findByProjectId(projectId);

        return tasks.stream()
                .map(this::toTaskResponse)
                .toList();
    }

    // =====================================================
    // CREATE TASK
    // =====================================================

    @Override
    public TaskResponse createTask(
            Long projectId,
            TaskRequest request) {

        if (projectId == null) {
            throw new IllegalArgumentException(
                    "Project ID không được để trống");
        }

        if (request == null) {
            throw new IllegalArgumentException(
                    "Thông tin công việc không được để trống");
        }

        if (request.getName() == null ||
                request.getName().isBlank()) {

            throw new IllegalArgumentException(
                    "Tên công việc không được để trống");
        }

        // =================================================
        // CURRENT USER
        // =================================================

        User currentUser = getCurrentUser();

        // =================================================
        // LẤY PROJECT
        // =================================================

        Project project =
                projectRepository.findById(projectId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Không tìm thấy dự án"));

        // =================================================
        // KIỂM TRA QUYỀN TẠO TASK
        // PM HOẶC ADMIN ĐƯỢC TẠO
        // =================================================

        boolean isProjectManager =
                project.getProjectManager() != null
                        && project.getProjectManager()
                                .getId()
                                .equals(currentUser.getId());

        boolean isAdmin =
                currentUser.getRole() != null
                        && currentUser.getRole()
                                .name()
                                .equalsIgnoreCase("ADMIN");

        if (!isProjectManager && !isAdmin) {
            throw new RuntimeException(
                    "Bạn không có quyền tạo công việc cho dự án này");
        }

        // =================================================
        // TẠO TASK
        // =================================================

        Task task = new Task();

        // =================================================
        // BASIC INFO
        // =================================================

        task.setTitle(
                request.getName().trim());

        task.setDescription(
                request.getDescription());

        task.setDeadline(
                request.getDeadline());

        // =================================================
        // PRIORITY
        // =================================================

        if (request.getPriority() != null &&
                !request.getPriority().isBlank()) {

            try {

                task.setPriority(
                        TaskPriority.valueOf(
                                request.getPriority()
                                        .trim()
                                        .toUpperCase()
                        ));

            } catch (IllegalArgumentException e) {

                throw new IllegalArgumentException(
                        "Độ ưu tiên không hợp lệ: "
                                + request.getPriority());
            }
        }

        // =================================================
        // STATUS
        // =================================================

        // Không sửa TaskStatus
        // Sử dụng enum hiện tại của project

        task.setStatus(
                TaskStatus.NOT_STARTED);

        // =================================================
        // PROGRESS
        // =================================================

        task.setProgressPercent(0);

        // =================================================
        // PROJECT
        // =================================================

        task.setProject(project);

        // =================================================
        // CREATED BY
        // =================================================

        task.setCreatedBy(currentUser);

        // =================================================
        // ASSIGNEES
        // =================================================

        List<Long> assigneeIds =
                request.getAssigneeIds();

        if (assigneeIds != null &&
                !assigneeIds.isEmpty()) {

            List<User> users =
                    userRepository.findAllById(
                            assigneeIds);

            task.setAssignees(
                    new HashSet<>(users));
        }

        // =================================================
        // SAVE
        // =================================================

        Task savedTask =
                taskRepository.save(task);

        return toTaskResponse(savedTask);
    }

    // =====================================================
    // UPDATE TASK
    // =====================================================

    @Override
    public TaskResponse updateTask(
            Long taskId,
            TaskRequest request) {

        if (taskId == null) {
            throw new IllegalArgumentException(
                    "Task ID không được để trống");
        }

        if (request == null) {
            throw new IllegalArgumentException(
                    "Thông tin công việc không được để trống");
        }

        if (request.getName() == null ||
                request.getName().isBlank()) {

            throw new IllegalArgumentException(
                    "Tên công việc không được để trống");
        }

        User currentUser = getCurrentUser();

        Task task =
                taskRepository.findById(taskId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Không tìm thấy công việc"));

        checkProjectManager(
                task,
                currentUser);

        // =================================================
        // BASIC INFO
        // =================================================

        task.setTitle(
                request.getName().trim());

        task.setDescription(
                request.getDescription());

        task.setDeadline(
                request.getDeadline());

        // =================================================
        // PRIORITY
        // =================================================

        if (request.getPriority() != null &&
                !request.getPriority().isBlank()) {

            try {

                task.setPriority(
                        TaskPriority.valueOf(
                                request.getPriority()
                                        .trim()
                                        .toUpperCase()
                        ));

            } catch (IllegalArgumentException e) {

                throw new IllegalArgumentException(
                        "Độ ưu tiên không hợp lệ: "
                                + request.getPriority());
            }
        }

        // =================================================
        // ASSIGNEES
        // =================================================

        List<Long> assigneeIds =
                request.getAssigneeIds();

        if (assigneeIds != null) {

            List<User> users =
                    userRepository.findAllById(
                            assigneeIds);

            task.setAssignees(
                    new HashSet<>(users));
        }

        // =================================================
        // SAVE
        // =================================================

        Task savedTask =
                taskRepository.save(task);

        return toTaskResponse(savedTask);
    }

    // =====================================================
    // DELETE TASK
    // =====================================================

    @Override
    public void deleteTask(Long taskId) {

        User currentUser = getCurrentUser();

        Task task =
                taskRepository.findById(taskId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Không tìm thấy công việc"));

        checkProjectManager(
                task,
                currentUser);

        taskRepository.delete(task);
    }

    // =====================================================
    // UPDATE STATUS
    // =====================================================

    @Override
    public TaskResponse updateStatus(
            Long taskId,
            String status) {

        User currentUser = getCurrentUser();

        Task task =
                taskRepository.findById(taskId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Không tìm thấy công việc"));

        checkProjectManagerOrAssignee(
                task,
                currentUser);

        if (status == null ||
                status.isBlank()) {

            throw new IllegalArgumentException(
                    "Trạng thái không được để trống");
        }

        TaskStatus taskStatus;

        try {

            taskStatus =
                    TaskStatus.valueOf(
                            status.trim().toUpperCase());

        } catch (IllegalArgumentException e) {

            throw new IllegalArgumentException(
                    "Trạng thái không hợp lệ: "
                            + status);
        }

        task.setStatus(taskStatus);

        // =================================================
        // DONE = 100%
        // =================================================

        if (taskStatus == TaskStatus.DONE) {

            task.setProgressPercent(100);
        }

        // =================================================
        // NOT_STARTED = 0%
        // =================================================

        if (taskStatus == TaskStatus.NOT_STARTED) {

            task.setProgressPercent(0);
        }

        Task savedTask =
                taskRepository.save(task);

        return toTaskResponse(savedTask);
    }

    // =====================================================
    // UPDATE PROGRESS
    // =====================================================

    @Override
    public TaskResponse updateProgress(
            Long taskId,
            Integer progress) {

        User currentUser = getCurrentUser();

        Task task =
                taskRepository.findById(taskId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Không tìm thấy công việc"));

        checkProjectManagerOrAssignee(
                task,
                currentUser);

        if (progress == null) {

            throw new IllegalArgumentException(
                    "Tiến độ không được để trống");
        }

        if (progress < 0 ||
                progress > 100) {

            throw new IllegalArgumentException(
                    "Tiến độ phải nằm trong khoảng 0 - 100%");
        }

        task.setProgressPercent(progress);

        // =================================================
        // AUTO STATUS
        // =================================================

        if (progress == 100) {

            task.setStatus(
                    TaskStatus.DONE);

        } else if (progress > 0) {

            task.setStatus(
                    TaskStatus.IN_PROGRESS);

        } else {

            task.setStatus(
                    TaskStatus.NOT_STARTED);
        }

        Task savedTask =
                taskRepository.save(task);

        return toTaskResponse(savedTask);
    }

    // =====================================================
    // UPDATE ASSIGNEES
    // =====================================================

    @Override
    public TaskResponse updateAssignees(
            Long taskId,
            UpdateAssigneesRequest request) {

        User currentUser = getCurrentUser();

        Task task =
                taskRepository.findById(taskId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Không tìm thấy công việc"));

        checkProjectManager(
                task,
                currentUser);

        List<Long> ids =
                new ArrayList<>();

        if (request != null &&
                request.getAssigneeIds() != null) {

            ids = request.getAssigneeIds();
        }

        List<User> users =
                userRepository.findAllById(ids);

        task.setAssignees(
                new HashSet<>(users));

        Task savedTask =
                taskRepository.save(task);

        return toTaskResponse(savedTask);
    }

    // =====================================================
    // ADD COMMENT
    // =====================================================

    @Override
    public TaskCommentResponse addComment(
            Long taskId,
            CommentRequest request) {

        User currentUser = getCurrentUser();

        Task task =
                taskRepository.findById(taskId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Không tìm thấy công việc"));

        checkProjectManagerOrAssignee(
                task,
                currentUser);

        if (request == null ||
                request.getContent() == null ||
                request.getContent().isBlank()) {

            throw new IllegalArgumentException(
                    "Nội dung ghi chú không được để trống");
        }

        /*
         * Phần Comment cần Entity TaskComment
         * và CommentRepository.
         */

        throw new UnsupportedOperationException(
                "Chưa cấu hình Entity TaskComment");
    }

    // =====================================================
    // GET COMMENTS
    // =====================================================

    @Override
    @Transactional(readOnly = true)
    public List<TaskCommentResponse> getComments(
            Long taskId) {

        if (taskId == null) {

            throw new IllegalArgumentException(
                    "Task ID không được để trống");
        }

        taskRepository.findById(taskId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy công việc"));

        /*
         * Phần Comment cần Entity TaskComment
         * và CommentRepository.
         */

        return List.of();
    }

    // =====================================================
    // GET CURRENT USER
    // =====================================================

    private User getCurrentUser() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            throw new RuntimeException(
                    "Bạn chưa đăng nhập");
        }

        String email =
                authentication.getName();

        if (email == null ||
                email.isBlank()) {

            throw new RuntimeException(
                    "Không xác định được người dùng hiện tại");
        }

        return userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy tài khoản"));
    }

    // =====================================================
    // CHECK PROJECT MANAGER
    // =====================================================

    private void checkProjectManager(
            Task task,
            User currentUser) {

        if (task.getProject() == null) {

            throw new RuntimeException(
                    "Công việc chưa thuộc dự án");
        }

        if (task.getProject()
                .getProjectManager() == null) {

            throw new RuntimeException(
                    "Dự án chưa có quản lý dự án");
        }

        Long managerId =
                task.getProject()
                        .getProjectManager()
                        .getId();

        boolean isProjectManager =
                managerId.equals(
                        currentUser.getId());

        boolean isAdmin =
                currentUser.getRole() != null
                        && currentUser.getRole()
                                .name()
                                .equalsIgnoreCase("ADMIN");

        if (!isProjectManager && !isAdmin) {

            throw new RuntimeException(
                    "Bạn không có quyền quản lý công việc này");
        }
    }

    // =====================================================
    // CHECK PROJECT MANAGER OR ASSIGNEE
    // =====================================================

    private void checkProjectManagerOrAssignee(
            Task task,
            User currentUser) {

        // =================================================
        // ADMIN
        // =================================================

        boolean isAdmin =
                currentUser.getRole() != null
                        && currentUser.getRole()
                                .name()
                                .equalsIgnoreCase("ADMIN");

        if (isAdmin) {
            return;
        }

        // =================================================
        // PROJECT MANAGER
        // =================================================

        if (task.getProject() != null &&
                task.getProject()
                        .getProjectManager() != null) {

            Long managerId =
                    task.getProject()
                            .getProjectManager()
                            .getId();

            if (managerId.equals(
                    currentUser.getId())) {

                return;
            }
        }

        // =================================================
        // ASSIGNEE
        // =================================================

        boolean assigned =
                task.getAssignees()
                        .stream()
                        .anyMatch(user ->
                                user.getId()
                                        .equals(
                                                currentUser.getId()));

        if (!assigned) {

            throw new RuntimeException(
                    "Bạn không có quyền cập nhật công việc này");
        }
    }

    // =====================================================
    // ENTITY -> RESPONSE
    // =====================================================

    private TaskResponse toTaskResponse(
            Task task) {

        List<TaskResponse.AssigneeResponse>
                assignees =
                task.getAssignees()
                        .stream()
                        .map(user ->
                                TaskResponse
                                        .AssigneeResponse
                                        .builder()
                                        .id(user.getId())
                                        .fullName(
                                                user.getFullName())
                                        .email(
                                                user.getEmail())
                                        .build())
                        .toList();

        return TaskResponse.builder()

                .id(task.getId())

                // Frontend dùng task.name
                .name(task.getTitle())

                .description(
                        task.getDescription())

                .deadline(
                        task.getDeadline())

                .priority(
                        task.getPriority() != null
                                ? task.getPriority().name()
                                : null)

                .status(
                        task.getStatus() != null
                                ? task.getStatus().name()
                                : null)

                .progressPercent(
                        task.getProgressPercent())

                .projectId(
                        task.getProject() != null
                                ? task.getProject().getId()
                                : null)

                .projectName(
                        task.getProject() != null
                                ? task.getProject().getName()
                                : null)

                .assignees(assignees)

                .build();
    }
}