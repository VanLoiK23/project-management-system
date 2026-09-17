package com.c2.project_management_system.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.c2.project_management_system.dto.request.CommentRequest;
import com.c2.project_management_system.dto.request.TaskRequest;
import com.c2.project_management_system.dto.request.UpdateAssigneesRequest;
import com.c2.project_management_system.dto.respone.TaskCommentResponse;
import com.c2.project_management_system.dto.respone.TaskPageResponse;
import com.c2.project_management_system.dto.respone.TaskResponse;
import com.c2.project_management_system.service.TaskService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TaskController {

	private final TaskService taskService;

	@GetMapping("/member/tasks")
	public ResponseEntity<TaskPageResponse> getMyTasks(@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "10") int size, @RequestParam(required = false) String keyword,
			@RequestParam(required = false) String status, @RequestParam(required = false) String priority,
			@RequestParam(defaultValue = "deadline") String sortBy,
			@RequestParam(defaultValue = "asc") String direction) {

		TaskPageResponse response = taskService.getMyTasks(page, size, keyword, status, priority, sortBy, direction);

		return ResponseEntity.ok(response);
	}

	@GetMapping("/member/tasks/{projectId}/my-tasks")
	public ResponseEntity<?> getMyTasksFromProject(@PathVariable(name = "projectId") Long projectId) {

		List<TaskResponse> response = taskService.getMyTasksFromProject(projectId);

		return ResponseEntity.ok(response);
	}

	// CHANGED: Task của PM được phân trang + filter + sort ở Backend
	@GetMapping("/projects/{projectId}/tasks")
	public ResponseEntity<TaskPageResponse> getProjectTasks(@PathVariable Long projectId,
			@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size,
			@RequestParam(required = false) String keyword, @RequestParam(required = false) String status,
			@RequestParam(required = false) String priority, @RequestParam(required = false) Long assigneeId,
			@RequestParam(defaultValue = "deadline") String sortBy,
			@RequestParam(defaultValue = "asc") String direction) {

		TaskPageResponse response = taskService.getTasksByProject(projectId, page, size, keyword, status, priority,
				assigneeId, sortBy, direction);

		return ResponseEntity.ok(response);
	}

	@PostMapping("/projects/{projectId}/tasks")
	public ResponseEntity<?> createTask(@PathVariable Long projectId, @Valid @RequestBody TaskRequest request) {

		TaskResponse response = taskService.createTask(projectId, request);

		return ResponseEntity.status(HttpStatus.CREATED)
				.body(Map.of("message", "Tạo công việc thành công", "data", response));
	}

	@PutMapping("/tasks/{id}")
	public ResponseEntity<?> updateTask(@PathVariable Long id, @Valid @RequestBody TaskRequest request) {

		TaskResponse response = taskService.updateTask(id, request);

		return ResponseEntity.ok(Map.of("message", "Cập nhật công việc thành công", "data", response));
	}

	@DeleteMapping("/tasks/{id}")
	public ResponseEntity<?> deleteTask(@PathVariable Long id) {

		taskService.deleteTask(id);

		return ResponseEntity.ok(Map.of("message", "Xóa công việc thành công"));
	}

	@PutMapping("/tasks/{id}/status")
	public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> request) {

		String status = request.get("status");

		if (status == null || status.isBlank()) {
			return ResponseEntity.badRequest().body(Map.of("message", "Trạng thái không được để trống"));
		}

		TaskResponse response = taskService.updateStatus(id, status);

		return ResponseEntity.ok(Map.of("message", "Cập nhật trạng thái thành công", "data", response));
	}

	@PutMapping("/tasks/{id}/progress")
	public ResponseEntity<?> updateProgress(@PathVariable Long id, @RequestBody Map<String, Integer> request) {

		Integer progress = request.get("progressPercent");

		if (progress == null) {
			return ResponseEntity.badRequest().body(Map.of("message", "Tiến độ không được để trống"));
		}

		if (progress < 0 || progress > 100) {
			return ResponseEntity.badRequest().body(Map.of("message", "Tiến độ phải từ 0 đến 100"));
		}

		TaskResponse response = taskService.updateProgress(id, progress);

		return ResponseEntity.ok(Map.of("message", "Cập nhật tiến độ thành công", "data", response));
	}

	@GetMapping("/tasks/{id}")
	public ResponseEntity<?> getDetailTask(@PathVariable Long id) {

		TaskResponse response = taskService.findTaskById(id);

		return ResponseEntity.ok(response);
	}

	@PutMapping("/tasks/{id}/assignees")
	public ResponseEntity<?> updateAssignees(@PathVariable Long id,
			@Valid @RequestBody UpdateAssigneesRequest request) {

		TaskResponse response = taskService.updateAssignees(id, request);

		return ResponseEntity.ok(Map.of("message", "Cập nhật người thực hiện thành công", "data", response));
	}

	@PostMapping("/tasks/{id}/comments")
	public ResponseEntity<?> addComment(@PathVariable Long id, @Valid @RequestBody CommentRequest request) {

		TaskCommentResponse response = taskService.addComment(id, request);

		return ResponseEntity.ok(Map.of("message", "Thêm ghi chú thành công", "data", response));
	}

	@GetMapping("/tasks/{id}/comments")
	public ResponseEntity<?> getComments(@PathVariable Long id) {

		List<TaskCommentResponse> comments = taskService.getComments(id);

		return ResponseEntity.ok(Map.of("data", comments));
	}
}