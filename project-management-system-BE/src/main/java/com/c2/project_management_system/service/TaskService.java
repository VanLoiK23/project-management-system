package com.c2.project_management_system.service;

import java.util.List;

import com.c2.project_management_system.dto.request.CommentRequest;
import com.c2.project_management_system.dto.request.TaskRequest;
import com.c2.project_management_system.dto.request.UpdateAssigneesRequest;
import com.c2.project_management_system.dto.respone.TaskCommentResponse;
import com.c2.project_management_system.dto.respone.TaskPageResponse;
import com.c2.project_management_system.dto.respone.TaskResponse;

public interface TaskService {

	TaskPageResponse getMyTasks(int page, int size, String keyword, String status, String priority, String sortBy,
			String direction);
	
	List<TaskResponse> getMyTasksFromProject(Long projectId);

	List<TaskResponse> getTasksForCurrentUser();

	TaskPageResponse getTasksByProject(Long projectId, int page, int size, String keyword, String status,
			String priority, Long assigneeId, String sortBy, String direction);

	TaskResponse createTask(Long projectId, TaskRequest request);

	TaskResponse updateTask(Long taskId, TaskRequest request);

	void deleteTask(Long taskId);

	TaskResponse updateStatus(Long taskId, String status);

	TaskResponse updateProgress(Long taskId, Integer progress);

	TaskResponse updateAssignees(Long taskId, UpdateAssigneesRequest request);
	
	TaskResponse findTaskById(Long taskId);

	TaskCommentResponse addComment(Long taskId, CommentRequest request);

	List<TaskCommentResponse> getComments(Long taskId);
}