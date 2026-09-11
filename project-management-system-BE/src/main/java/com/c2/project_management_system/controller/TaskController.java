package com.c2.project_management_system.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.c2.project_management_system.dto.request.CommentRequest;
import com.c2.project_management_system.dto.request.TaskRequest;
import com.c2.project_management_system.dto.request.UpdateAssigneesRequest;
import com.c2.project_management_system.dto.respone.TaskCommentResponse;
import com.c2.project_management_system.dto.respone.TaskResponse;
import com.c2.project_management_system.service.TaskService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    // =====================================================
    // MEMBER - LẤY TASK CỦA USER ĐANG ĐĂNG NHẬP
    // GET /api/member/tasks
    // =====================================================

    @GetMapping("/member/tasks")
    public ResponseEntity<?> getMyTasks() {

        List<TaskResponse> tasks =
                taskService.getTasksForCurrentUser();

        return ResponseEntity.ok(
                Map.of("data", tasks)
        );
    }

    // =====================================================
    // PM - LẤY TẤT CẢ TASK TRONG PROJECT
    // GET /api/projects/{projectId}/tasks
    // =====================================================

    @GetMapping("/projects/{projectId}/tasks")
    public ResponseEntity<?> getProjectTasks(
            @PathVariable Long projectId) {

        List<TaskResponse> tasks =
                taskService.getTasksByProject(projectId);

        return ResponseEntity.ok(
                Map.of("data", tasks)
        );
    }

    // =====================================================
    // PM - TẠO TASK
    // POST /api/projects/{projectId}/tasks
    // =====================================================

    @PostMapping("/projects/{projectId}/tasks")
    public ResponseEntity<?> createTask(
            @PathVariable Long projectId,
            @RequestBody TaskRequest request) {

        TaskResponse response =
                taskService.createTask(
                        projectId,
                        request
                );

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Tạo công việc thành công",
                        "data",
                        response
                )
        );
    }

    // =====================================================
    // PM - CẬP NHẬT THÔNG TIN TASK
    // PUT /api/tasks/{id}
    // =====================================================

    @PutMapping("/tasks/{id}")
    public ResponseEntity<?> updateTask(
            @PathVariable Long id,
            @RequestBody TaskRequest request) {

        TaskResponse response =
                taskService.updateTask(
                        id,
                        request
                );

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Cập nhật công việc thành công",
                        "data",
                        response
                )
        );
    }

    // =====================================================
    // PM - XÓA TASK
    // DELETE /api/tasks/{id}
    // =====================================================

    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<?> deleteTask(
            @PathVariable Long id) {

        taskService.deleteTask(id);

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Xóa công việc thành công"
                )
        );
    }

    // =====================================================
    // UPDATE STATUS
    // PUT /api/tasks/{id}/status
    // =====================================================

    @PutMapping("/tasks/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {

        String status = request.get("status");

        if (status == null || status.isBlank()) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "message",
                            "Trạng thái không được để trống"
                    )
            );
        }

        TaskResponse response =
                taskService.updateStatus(
                        id,
                        status
                );

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Cập nhật trạng thái thành công",
                        "data",
                        response
                )
        );
    }

    // =====================================================
    // UPDATE PROGRESS
    // PUT /api/tasks/{id}/progress
    // =====================================================

    @PutMapping("/tasks/{id}/progress")
    public ResponseEntity<?> updateProgress(
            @PathVariable Long id,
            @RequestBody Map<String, Integer> request) {

        Integer progress =
                request.get("progressPercent");

        if (progress == null) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "message",
                            "Tiến độ không được để trống"
                    )
            );
        }

        if (progress < 0 || progress > 100) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "message",
                            "Tiến độ phải từ 0 đến 100"
                    )
            );
        }

        TaskResponse response =
                taskService.updateProgress(
                        id,
                        progress
                );

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Cập nhật tiến độ thành công",
                        "data",
                        response
                )
        );
    }

    // =====================================================
    // ASSIGN TASK
    // PUT /api/tasks/{id}/assignees
    // =====================================================

    @PutMapping("/tasks/{id}/assignees")
    public ResponseEntity<?> updateAssignees(
            @PathVariable Long id,
            @RequestBody UpdateAssigneesRequest request) {

        TaskResponse response =
                taskService.updateAssignees(
                        id,
                        request
                );

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Cập nhật người thực hiện thành công",
                        "data",
                        response
                )
        );
    }

    // =====================================================
    // ADD COMMENT
    // POST /api/tasks/{id}/comments
    // =====================================================

    @PostMapping("/tasks/{id}/comments")
    public ResponseEntity<?> addComment(
            @PathVariable Long id,
            @RequestBody CommentRequest request) {

        TaskCommentResponse response =
                taskService.addComment(
                        id,
                        request
                );

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Thêm ghi chú thành công",
                        "data",
                        response
                )
        );
    }

    // =====================================================
    // GET COMMENTS
    // GET /api/tasks/{id}/comments
    // =====================================================

    @GetMapping("/tasks/{id}/comments")
    public ResponseEntity<?> getComments(
            @PathVariable Long id) {

        List<TaskCommentResponse> comments =
                taskService.getComments(id);

        return ResponseEntity.ok(
                Map.of("data", comments)
        );
    }
}