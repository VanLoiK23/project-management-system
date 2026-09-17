package com.c2.project_management_system.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.c2.project_management_system.dto.request.CommentRequest;
import com.c2.project_management_system.dto.request.TaskRequest;
import com.c2.project_management_system.dto.request.UpdateAssigneesRequest;
import com.c2.project_management_system.dto.respone.TaskCommentResponse;
import com.c2.project_management_system.dto.respone.TaskPageResponse;
import com.c2.project_management_system.dto.respone.TaskResponse;
import com.c2.project_management_system.dto.respone.TaskStatisticsResponse;
import com.c2.project_management_system.entity.Milestone;
import com.c2.project_management_system.entity.Project;
import com.c2.project_management_system.entity.Task;
import com.c2.project_management_system.entity.TaskComment;
import com.c2.project_management_system.entity.User;
import com.c2.project_management_system.repository.ProjectMemberRepository;
import com.c2.project_management_system.repository.ProjectRepository;
import com.c2.project_management_system.repository.TaskCommentRepository;
import com.c2.project_management_system.repository.TaskRepository;
import com.c2.project_management_system.repository.UserRepository;
import com.c2.project_management_system.service.MilestoneService;
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
	private final ProjectMemberRepository projectMemberRepository;
	private final TaskCommentRepository taskCommentRepository;
	private final MilestoneService milestoneService;

	@Override
	@Transactional(readOnly = true)
	public List<TaskResponse> getTasksForCurrentUser() {

		User currentUser = getCurrentUser();

		return taskRepository.findByAssigneesContaining(currentUser).stream().map(this::toTaskResponse).toList();
	}

	// CHANGED: server-side pagination + filter + sorting
	@Override
	@Transactional(readOnly = true)
	public TaskPageResponse getTasksByProject(Long projectId, int page, int size, String keyword, String status,
			String priority, Long assigneeId, String sortBy, String direction) {

		if (projectId == null) {
			throw new IllegalArgumentException("Project ID không được để trống");
		}

		User currentUser = getCurrentUser();

		Project project = projectRepository.findById(projectId)
				.orElseThrow(() -> new RuntimeException("Không tìm thấy dự án"));

		checkProjectAccess(project, currentUser);

		page = Math.max(page, 0);

		if (size <= 0) {
			size = 10;
		}

		if (size > 100) {
			size = 100;
		}

		TaskStatus taskStatus = parseStatus(status);

		TaskPriority taskPriority = parsePriority(priority);

		String normalizedKeyword = keyword == null ? null : keyword.trim();

		Sort sort = buildSort(sortBy, direction);

		Pageable pageable = PageRequest.of(page, size, sort);

		Page<Task> taskPage = taskRepository.findProjectTasks(projectId, normalizedKeyword, taskStatus, taskPriority,
				assigneeId, pageable);

		List<TaskResponse> content = taskPage.getContent().stream().map(this::toTaskResponse).toList();

		TaskStatisticsResponse statistics = buildStatistics(projectId);

		return TaskPageResponse.builder().content(content).page(taskPage.getNumber()).size(taskPage.getSize())
				.totalElements(taskPage.getTotalElements()).totalPages(taskPage.getTotalPages())
				.first(taskPage.isFirst()).last(taskPage.isLast()).statistics(statistics).build();
	}

	@Override
	public TaskResponse createTask(Long projectId, TaskRequest request) {

		if (projectId == null) {
			throw new IllegalArgumentException("Project ID không được để trống");
		}

		if (request == null) {
			throw new IllegalArgumentException("Thông tin công việc không được để trống");
		}

		User currentUser = getCurrentUser();

		Project project = projectRepository.findById(projectId)
				.orElseThrow(() -> new RuntimeException("Không tìm thấy dự án"));

		checkProjectManager(project, currentUser);

		checkProjectAllowsTaskManagement(project);

		validateDeadline(request.getDeadline(), project);

		TaskPriority taskPriority = parsePriorityRequired(request.getPriority());

		List<Long> assigneeIds = normalizeIds(request.getAssigneeIds());

		validateAssignees(projectId, assigneeIds);

		Task task = new Task();

		task.setTitle(request.getName().trim());

		task.setDescription(request.getDescription() == null ? null : request.getDescription().trim());

		task.setDeadline(request.getDeadline());

		task.setPriority(taskPriority);

		task.setStatus(TaskStatus.NOT_STARTED);

		task.setProgressPercent(0);

		task.setProject(project);

		task.setCreatedBy(currentUser);

		List<User> users = userRepository.findAllById(assigneeIds);

		if (users.size() != assigneeIds.size()) {
			throw new IllegalArgumentException("Một hoặc nhiều người thực hiện không tồn tại");
		}

		task.setAssignees(new HashSet<>(users));

		Task savedTask = taskRepository.save(task);

		return toTaskResponse(savedTask);
	}

	@Override
	public TaskResponse updateTask(Long taskId, TaskRequest request) {

		if (taskId == null) {
			throw new IllegalArgumentException("Task ID không được để trống");
		}

		if (request == null) {
			throw new IllegalArgumentException("Thông tin công việc không được để trống");
		}

		User currentUser = getCurrentUser();

		Task task = taskRepository.findById(taskId).orElseThrow(() -> new RuntimeException("Không tìm thấy công việc"));

		checkProjectManager(task, currentUser);

		Project project = task.getProject();

		checkProjectAllowsTaskManagement(project);

		validateDeadline(request.getDeadline(), project);

		TaskPriority taskPriority = parsePriorityRequired(request.getPriority());

		List<Long> assigneeIds = normalizeIds(request.getAssigneeIds());

		validateAssignees(project.getId(), assigneeIds);

		task.setTitle(request.getName().trim());

		task.setDescription(request.getDescription() == null ? null : request.getDescription().trim());

		task.setDeadline(request.getDeadline());

		task.setPriority(taskPriority);

		List<User> users = userRepository.findAllById(assigneeIds);

		if (users.size() != assigneeIds.size()) {
			throw new IllegalArgumentException("Một hoặc nhiều người thực hiện không tồn tại");
		}

		task.setAssignees(new HashSet<>(users));

		Task savedTask = taskRepository.save(task);

		return toTaskResponse(savedTask);
	}

	@Override
	public void deleteTask(Long taskId) {

		if (taskId == null) {
			throw new IllegalArgumentException("Task ID không được để trống");
		}

		User currentUser = getCurrentUser();

		Task task = taskRepository.findById(taskId).orElseThrow(() -> new RuntimeException("Không tìm thấy công việc"));

		checkProjectManager(task, currentUser);

		checkProjectAllowsTaskManagement(task.getProject());

		Set<Milestone> milestones = new HashSet<>(task.getMilestones());

		for (Milestone milestone : milestones) {
			milestone.getTasks().remove(task);
		}

		task.getMilestones().clear();

		taskRepository.delete(task);

		milestoneService.recalculateMilestones(milestones);
	}

	@Override
	public TaskResponse updateStatus(Long taskId, String status) {

		User currentUser = getCurrentUser();

		Task task = taskRepository.findById(taskId).orElseThrow(() -> new RuntimeException("Không tìm thấy công việc"));

		checkProjectManagerOrAssignee(task, currentUser);

		checkProjectAllowsTaskProgress(task.getProject());

		TaskStatus newStatus = parseStatusRequired(status);

		validateStatusTransition(task.getStatus(), newStatus);

		task.setStatus(newStatus);

		if (newStatus == TaskStatus.DONE) {
			task.setProgressPercent(100);
		}

		if (newStatus == TaskStatus.NOT_STARTED) {
			task.setProgressPercent(0);
		}

		Task savedTask = taskRepository.save(task);

		milestoneService.recalculateByTask(task.getId());

		return toTaskResponse(savedTask);
	}

	@Override
	public TaskResponse updateProgress(Long taskId, Integer progress) {

		User currentUser = getCurrentUser();

		Task task = taskRepository.findById(taskId).orElseThrow(() -> new RuntimeException("Không tìm thấy công việc"));

		checkProjectManagerOrAssignee(task, currentUser);

		checkProjectAllowsTaskProgress(task.getProject());

		if (progress == null) {
			throw new IllegalArgumentException("Tiến độ không được để trống");
		}

		if (progress < 0 || progress > 100) {
			throw new IllegalArgumentException("Tiến độ phải từ 0 đến 100%");
		}

		task.setProgressPercent(progress);

		if (progress == 100) {

			task.setStatus(TaskStatus.DONE);

		} else if (progress > 0) {

			task.setStatus(TaskStatus.IN_PROGRESS);

		} else {
			task.setStatus(TaskStatus.NOT_STARTED);
		}

		Task savedTask = taskRepository.save(task);

		milestoneService.recalculateByTask(task.getId());

		return toTaskResponse(savedTask);
	}

	@Override
	public TaskResponse updateAssignees(Long taskId, UpdateAssigneesRequest request) {

		User currentUser = getCurrentUser();

		Task task = taskRepository.findById(taskId).orElseThrow(() -> new RuntimeException("Không tìm thấy công việc"));

		checkProjectManager(task, currentUser);

		checkProjectAllowsTaskManagement(task.getProject());

		if (request == null || request.getAssigneeIds() == null || request.getAssigneeIds().isEmpty()) {

			throw new IllegalArgumentException("Phải phân công ít nhất một thành viên");
		}

		List<Long> ids = normalizeIds(request.getAssigneeIds());

		validateAssignees(task.getProject().getId(), ids);

		List<User> users = userRepository.findAllById(ids);

		if (users.size() != ids.size()) {
			throw new IllegalArgumentException("Một hoặc nhiều người thực hiện không tồn tại");
		}

		task.setAssignees(new HashSet<>(users));

		Task savedTask = taskRepository.save(task);

		return toTaskResponse(savedTask);
	}

	@Override
	public TaskCommentResponse addComment(Long taskId, CommentRequest request) {

		User currentUser = getCurrentUser();

		Task task = taskRepository.findById(taskId).orElseThrow(() -> new RuntimeException("Không tìm thấy công việc"));

		checkProjectManagerOrAssignee(task, currentUser);
		checkProjectAllowsTaskProgress(task.getProject());

		if (request == null || request.getContent() == null || request.getContent().isBlank()) {
			throw new IllegalArgumentException("Nội dung trao đổi không được để trống");
		}

		TaskComment comment = TaskComment.builder().task(task).author(currentUser).content(request.getContent().trim())
				.build();

		TaskComment savedComment = taskCommentRepository.save(comment);

		return TaskCommentResponse.builder().id(savedComment.getId()).content(savedComment.getContent())
				.userId(currentUser.getId()).userName(currentUser.getFullName()).createdAt(savedComment.getCreatedAt())
				.build();
	}

	@Override
	public List<TaskCommentResponse> getComments(Long taskId) {

		taskRepository.findById(taskId).orElseThrow(() -> new RuntimeException("Không tìm thấy công việc"));

		return taskCommentRepository.findByTaskIdOrderByCreatedAtAsc(taskId).stream()
				.map(comment -> TaskCommentResponse.builder().id(comment.getId()).content(comment.getContent())
						.userId(comment.getAuthor().getId()).userName(comment.getAuthor().getFullName())
						.createdAt(comment.getCreatedAt()).build())
				.toList();
	}

	@Override
	@Transactional(readOnly = true)
	public TaskPageResponse getMyTasks(int page, int size, String keyword, String status, String priority,
			String sortBy, String direction) {

		User currentUser = getCurrentUser();

		if (page < 0) {
			page = 0;
		}

		if (size < 1) {
			size = 10;
		}

		if (size > 100) {
			size = 100;
		}

		String sortField = switch (sortBy) {
		case "title" -> "title";
		case "status" -> "status";
		case "priority" -> "priority";
		case "progressPercent" -> "progressPercent";
		case "createdAt" -> "createdAt";
		case "deadline" -> "deadline";
		default -> "deadline";
		};

		Sort.Direction sortDirection = "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;

		Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortField));

		TaskStatus taskStatus = null;
		TaskPriority taskPriority = null;

		if (status != null && !status.isBlank()) {
			taskStatus = TaskStatus.valueOf(status.toUpperCase());
		}

		if (priority != null && !priority.isBlank()) {
			taskPriority = TaskPriority.valueOf(priority.toUpperCase());
		}

		Page<Task> taskPage = taskRepository.findMyTasks(currentUser.getId(), normalize(keyword), taskStatus,
				taskPriority, pageable);

		List<TaskResponse> content = taskPage.getContent().stream().map(this::toTaskResponse).toList();

		TaskStatisticsResponse statistics = buildMyTaskStatistics(currentUser.getId());

		return TaskPageResponse.builder().content(content).page(taskPage.getNumber()).size(taskPage.getSize())
				.totalElements(taskPage.getTotalElements()).totalPages(taskPage.getTotalPages()).statistics(statistics)
				.build();
	}

	@Override
	@Transactional(readOnly = true)
	public List<TaskResponse> getMyTasksFromProject(Long projectId) {

		User currentUser = getCurrentUser();

		Project project = projectRepository.findById(projectId)
				.orElseThrow(() -> new RuntimeException("Không tìm thấy dự án"));

		checkProjectAccess(project, currentUser);

		List<Task> tasks = taskRepository.findMyTasksFromProject(currentUser.getId(), projectId);

		return tasks.stream().map(this::toTaskResponse).collect(Collectors.toList());
	}

	private TaskStatisticsResponse buildMyTaskStatistics(Long userId) {

		long total = taskRepository.countMyTasks(userId);

		long notStarted = taskRepository.countMyTasksByStatus(userId, TaskStatus.NOT_STARTED);

		long inProgress = taskRepository.countMyTasksByStatus(userId, TaskStatus.IN_PROGRESS);

		long pending = taskRepository.countMyTasksByStatus(userId, TaskStatus.PENDING);

		long done = taskRepository.countMyTasksByStatus(userId, TaskStatus.DONE);

		long cancelled = taskRepository.countMyTasksByStatus(userId, TaskStatus.CANCELLED);

		long unfinished = taskRepository.countMyUnfinishedTasks(userId, List.of(TaskStatus.DONE, TaskStatus.CANCELLED));

		Double averageProgress = taskRepository.calculateMyAverageProgress(userId);

		double totalProgress = averageProgress == null ? 0 : Math.round(averageProgress * 10.0) / 10.0;

		return TaskStatisticsResponse.builder().total(total).completed(done).todo(notStarted).notStarted(notStarted)
				.inProgress(inProgress).pending(pending).done(done).cancelled(cancelled).unfinished(unfinished)
				.totalProgress(totalProgress).build();
	}

	private TaskStatisticsResponse buildStatistics(Long projectId) {

		long total = taskRepository.countByProjectId(projectId);

		long completed = taskRepository.countByProjectIdAndStatus(projectId, TaskStatus.DONE);

		long todo = taskRepository.countByProjectIdAndStatus(projectId, TaskStatus.NOT_STARTED);

		long notStarted = taskRepository.countByProjectIdAndStatus(projectId, TaskStatus.NOT_STARTED);

		long inProgress = taskRepository.countByProjectIdAndStatus(projectId, TaskStatus.IN_PROGRESS);

		long pending = taskRepository.countByProjectIdAndStatus(projectId, TaskStatus.PENDING);

		long done = taskRepository.countByProjectIdAndStatus(projectId, TaskStatus.DONE);

		long cancelled = taskRepository.countByProjectIdAndStatus(projectId, TaskStatus.CANCELLED);

		long unfinished = taskRepository.countUnfinishedTasks(projectId,
				List.of(TaskStatus.DONE, TaskStatus.CANCELLED));

		Double averageProgress = taskRepository.calculateAverageProgress(projectId);

		double totalProgress = averageProgress == null ? 0 : Math.round(averageProgress * 10.0) / 10.0;

		return TaskStatisticsResponse.builder().total(total).completed(completed).todo(todo).notStarted(notStarted)
				.inProgress(inProgress).pending(pending).done(done).cancelled(cancelled).unfinished(unfinished)
				.totalProgress(totalProgress).build();
	}

	private void validateDeadline(LocalDateTime deadline, Project project) {

		if (deadline == null) {
			throw new IllegalArgumentException("Deadline không được để trống");
		}

		LocalDateTime now = LocalDateTime.now();

		if (!deadline.isAfter(now)) {
			throw new IllegalArgumentException("Deadline phải sau thời điểm hiện tại");
		}

		if (project == null) {
			throw new IllegalArgumentException("Công việc chưa thuộc dự án");
		}

		LocalDate startDate = project.getStartDate();

		LocalDate endDate = project.getEndDate();

		if (startDate == null || endDate == null) {

			throw new IllegalArgumentException("Dự án chưa có đầy đủ ngày bắt đầu và kết thúc");
		}

		LocalDateTime minProjectDeadline = startDate.atStartOfDay();

		LocalDateTime maxProjectDeadline = endDate.atTime(LocalTime.MAX);

		if (deadline.isBefore(minProjectDeadline)) {

			throw new IllegalArgumentException("Deadline không được trước ngày bắt đầu dự án");
		}

		if (deadline.isAfter(maxProjectDeadline)) {

			throw new IllegalArgumentException("Deadline không được sau ngày kết thúc dự án");
		}
	}

	private void validateAssignees(Long projectId, List<Long> assigneeIds) {

		if (assigneeIds == null || assigneeIds.isEmpty()) {

			throw new IllegalArgumentException("Phải phân công ít nhất một thành viên");
		}

		for (Long userId : assigneeIds) {

			if (userId == null) {
				throw new IllegalArgumentException("User ID không hợp lệ");
			}

			boolean exists = projectMemberRepository.existsActiveMember(projectId, userId);

			if (!exists) {
				throw new IllegalArgumentException(
						"Người được phân công không phải thành viên ACTIVE của dự án: " + userId);
			}
		}
	}

	private List<Long> normalizeIds(List<Long> ids) {

		if (ids == null) {
			return new ArrayList<>();
		}

		return ids.stream().filter(id -> id != null).distinct().toList();
	}

	private TaskStatus parseStatus(String status) {

		if (status == null || status.isBlank()) {

			return null;
		}

		try {
			return TaskStatus.valueOf(status.trim().toUpperCase());

		} catch (IllegalArgumentException e) {

			throw new IllegalArgumentException("Trạng thái không hợp lệ: " + status);
		}
	}

	private TaskStatus parseStatusRequired(String status) {

		if (status == null || status.isBlank()) {

			throw new IllegalArgumentException("Trạng thái không được để trống");
		}

		return parseStatus(status);
	}

	private TaskPriority parsePriority(String priority) {

		if (priority == null || priority.isBlank()) {

			return null;
		}

		try {
			return TaskPriority.valueOf(priority.trim().toUpperCase());

		} catch (IllegalArgumentException e) {

			throw new IllegalArgumentException("Độ ưu tiên không hợp lệ: " + priority);
		}
	}

	private TaskPriority parsePriorityRequired(String priority) {

		TaskPriority result = parsePriority(priority);

		if (result == null) {
			throw new IllegalArgumentException("Độ ưu tiên không được để trống");
		}

		return result;
	}

	// CHANGED: chỉ cho phép chuyển trạng thái theo workflow
	private void validateStatusTransition(TaskStatus current, TaskStatus next) {

		if (current == null) {
			return;
		}

		if (current == next) {
			return;
		}

		boolean allowed = switch (current) {

		case NOT_STARTED -> next == TaskStatus.IN_PROGRESS || next == TaskStatus.CANCELLED;

		case IN_PROGRESS -> next == TaskStatus.PENDING || next == TaskStatus.DONE || next == TaskStatus.CANCELLED;

		case PENDING -> next == TaskStatus.IN_PROGRESS || next == TaskStatus.CANCELLED;

		case DONE -> false;

		case CANCELLED -> false;
		};

		if (!allowed) {
			throw new IllegalArgumentException(
					"Không thể chuyển trạng thái từ " + current.name() + " sang " + next.name());
		}
	}

	private Sort buildSort(String sortBy, String direction) {

		String field;

		if (sortBy == null || sortBy.isBlank()) {

			field = "deadline";

		} else {

			field = switch (sortBy.trim().toLowerCase()) {

			case "name" -> "title";

			case "title" -> "title";

			case "deadline" -> "deadline";

			case "priority" -> "priority";

			case "status" -> "status";

			default -> "deadline";
			};
		}

		Sort.Direction sortDirection = "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;

		return Sort.by(sortDirection, field);
	}

	private void checkProjectAccess(Project project, User currentUser) {

		if (project == null) {
			throw new RuntimeException("Không tìm thấy dự án");
		}

		boolean isAdmin = isAdmin(currentUser);

		boolean isManager = project.getProjectManager() != null
				&& project.getProjectManager().getId().equals(currentUser.getId());

		boolean isMember = projectMemberRepository.existsActiveMember(project.getId(), currentUser.getId());

		if (!isAdmin && !isManager && !isMember) {

			throw new RuntimeException("Bạn không có quyền xem công việc của dự án này");
		}
	}

	private void checkProjectManager(Task task, User currentUser) {

		if (task == null || task.getProject() == null) {

			throw new RuntimeException("Công việc chưa thuộc dự án");
		}

		checkProjectManager(task.getProject(), currentUser);
	}

	private void checkProjectManager(Project project, User currentUser) {

		if (project.getProjectManager() == null) {
			throw new RuntimeException("Dự án chưa có quản lý dự án");
		}

		boolean manager = project.getProjectManager().getId().equals(currentUser.getId());

		if (!manager && !isAdmin(currentUser)) {

			throw new RuntimeException("Bạn không có quyền quản lý công việc này");
		}
	}

	private void checkProjectManagerOrAssignee(Task task, User currentUser) {

		if (isAdmin(currentUser)) {
			return;
		}

		if (task.getProject() != null && task.getProject().getProjectManager() != null
				&& task.getProject().getProjectManager().getId().equals(currentUser.getId())) {

			return;
		}

		if (task.getAssignees() != null
				&& task.getAssignees().stream().anyMatch(user -> user.getId().equals(currentUser.getId()))) {

			return;
		}

		throw new RuntimeException("Bạn không có quyền cập nhật công việc này");
	}

	private void checkProjectAllowsTaskManagement(Project project) {

		if (project == null) {
			throw new RuntimeException("Công việc chưa thuộc dự án");
		}

		String status = project.getStatus() == null ? "" : project.getStatus().name();

		if ("CLOSED".equals(status)) {
			throw new RuntimeException("Dự án đã đóng, không thể thay đổi công việc");
		}

		if ("CANCELLED".equals(status)) {
			throw new RuntimeException("Dự án đã hủy, không thể thay đổi công việc");
		}
	}

	private void checkProjectAllowsTaskProgress(Project project) {

		checkProjectAllowsTaskManagement(project);
	}

	private boolean isAdmin(User user) {

		return user != null && user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole().name());
	}

	private User getCurrentUser() {

		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

		if (authentication == null || !authentication.isAuthenticated()) {

			throw new RuntimeException("Bạn chưa đăng nhập");
		}

		Object principal = authentication.getPrincipal();

		if (principal instanceof User) {
			return (User) principal;
		}

		if (principal instanceof org.springframework.security.core.userdetails.User) {

			String email = ((org.springframework.security.core.userdetails.User) principal).getUsername();

			return userRepository.findByEmail(email.trim())
					.orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản: " + email));
		}

		if (principal instanceof String) {

			String username = principal.toString().trim();

			User user = userRepository.findByEmail(username).orElse(null);

			if (user != null) {
				return user;
			}

			user = userRepository.findByFullName(username).orElse(null);

			if (user != null) {
				return user;
			}

			throw new RuntimeException("Không tìm thấy tài khoản: " + username);
		}

		throw new RuntimeException("Không xác định được người dùng hiện tại");
	}

	private TaskResponse toTaskResponse(Task task) {

		List<TaskResponse.AssigneeResponse> assignees = task.getAssignees().stream()
				.map(user -> TaskResponse.AssigneeResponse.builder().id(user.getId()).fullName(user.getFullName())
						.email(user.getEmail()).build())
				.toList();

		return TaskResponse.builder()

				.id(task.getId())

				.name(task.getTitle())

				.description(task.getDescription())

				.deadline(task.getDeadline())

				.priority(task.getPriority() != null ? task.getPriority().name() : null)

				.status(task.getStatus() != null ? task.getStatus().name() : null)

				.progressPercent(task.getProgressPercent())

				.projectId(task.getProject() != null ? task.getProject().getId() : null)

				.projectName(task.getProject() != null ? task.getProject().getName() : null)

				.assignees(assignees)

				.build();
	}

	private String normalize(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}

		return value.trim();
	}

	@Override
	public TaskResponse findTaskById(Long taskId) {
		User currentUser = getCurrentUser();

		Task task = taskRepository.findById(taskId).orElseThrow(() -> new RuntimeException("Không tìm thấy công việc"));

		checkProjectManagerOrAssignee(task, currentUser);
		return toTaskResponse(task);
	}

}