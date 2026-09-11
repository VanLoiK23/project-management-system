package com.c2.project_management_system.service;

import java.util.List;

import com.c2.project_management_system.dto.request.CommentRequest;
import com.c2.project_management_system.dto.request.TaskRequest;
import com.c2.project_management_system.dto.request.UpdateAssigneesRequest;
import com.c2.project_management_system.dto.respone.TaskCommentResponse;
import com.c2.project_management_system.dto.respone.TaskResponse;

public interface TaskService {

    // Member
    List<TaskResponse> getTasksForCurrentUser();

    // PM
    List<TaskResponse> getTasksByProject(Long projectId);

    TaskResponse createTask(
            Long projectId,
            TaskRequest request);

    TaskResponse updateTask(
            Long taskId,
            TaskRequest request);

    void deleteTask(Long taskId);

    // Status
    TaskResponse updateStatus(
            Long taskId,
            String status);

    // Progress
    TaskResponse updateProgress(
            Long taskId,
            Integer progress);

    // Assignees
    TaskResponse updateAssignees(
            Long taskId,
            UpdateAssigneesRequest request);

    // Comments
    TaskCommentResponse addComment(
            Long taskId,
            CommentRequest request);

    List<TaskCommentResponse> getComments(
            Long taskId);
}