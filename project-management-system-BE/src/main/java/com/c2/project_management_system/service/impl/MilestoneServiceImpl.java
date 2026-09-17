package com.c2.project_management_system.service.impl;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.c2.project_management_system.dto.request.MilestoneCreateRequest;
import com.c2.project_management_system.dto.request.MilestoneUpdateRequest;
import com.c2.project_management_system.dto.respone.MilestoneResponse;
import com.c2.project_management_system.entity.Milestone;
import com.c2.project_management_system.entity.Project;
import com.c2.project_management_system.entity.Task;
import com.c2.project_management_system.repository.MilestoneRepository;
import com.c2.project_management_system.repository.ProjectMemberRepository;
import com.c2.project_management_system.repository.ProjectRepository;
import com.c2.project_management_system.repository.TaskRepository;
import com.c2.project_management_system.repository.UserRepository;
import com.c2.project_management_system.service.MilestoneService;
import com.c2.project_management_system.statusEnum.ProjectStatus;
import com.c2.project_management_system.statusEnum.TaskStatus;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class MilestoneServiceImpl implements MilestoneService {

	private final MilestoneRepository milestoneRepository;
	private final ProjectRepository projectRepository;
	private final ProjectMemberRepository projectMemberRepository;
	private final TaskRepository taskRepository;
	private final UserRepository userRepository;

	@Override
	public MilestoneResponse createMilestone(Long currentUserId, MilestoneCreateRequest request) {

		Project project = getProject(request.getProjectId());

		checkCanManageMilestone(project, currentUserId, false);

		validateDates(request.getStartDate(), request.getEndDate());

		validateProjectDateRange(project, request.getStartDate(), request.getEndDate());

		String name = request.getName().trim();

		if (milestoneRepository.existsByProjectIdAndNameIgnoreCase(project.getId(), name)) {

			throw new IllegalArgumentException("Milestone đã tồn tại trong dự án");
		}

		validateNoOverlap(project.getId(), request.getStartDate(), request.getEndDate(), null);

		Set<Task> tasks = loadAndValidateTasks(project, request.getTaskIds());

		Milestone milestone = Milestone.builder().name(name).startDate(request.getStartDate())
				.endDate(request.getEndDate()).project(project).tasks(tasks).progressPercent(0).build();

		milestoneRepository.save(milestone);

		recalculateProgress(milestone);

		return toResponse(milestone);
	}

	@Override
	public MilestoneResponse updateMilestone(Long milestoneId, Long currentUserId, MilestoneUpdateRequest request,
			boolean isAdmin) {

		Milestone milestone = getMilestone(milestoneId);

		Project project = milestone.getProject();

		checkCanManageMilestone(project, currentUserId, isAdmin);

		checkProjectEditable(project);

		validateDates(request.getStartDate(), request.getEndDate());

		validateProjectDateRange(project, request.getStartDate(), request.getEndDate());

		String name = request.getName().trim();

		if (milestoneRepository.existsByProjectIdAndNameIgnoreCaseAndIdNot(project.getId(), name, milestoneId)) {

			throw new IllegalArgumentException("Milestone đã tồn tại trong dự án");
		}

		validateNoOverlap(project.getId(), request.getStartDate(), request.getEndDate(), milestoneId);

		Set<Task> tasks = loadAndValidateTasks(project, request.getTaskIds());

		milestone.setName(name);
		milestone.setStartDate(request.getStartDate());
		milestone.setEndDate(request.getEndDate());
		milestone.setTasks(tasks);

		recalculateProgress(milestone);

		milestoneRepository.save(milestone);

		return toResponse(milestone);
	}

	@Override
	public void deleteMilestone(Long milestoneId, Long currentUserId, boolean isAdmin) {

		Milestone milestone = getMilestone(milestoneId);

		Project project = milestone.getProject();

		checkCanManageMilestone(project, currentUserId, isAdmin);

		checkProjectEditable(project);

		milestone.getTasks().clear();

		milestoneRepository.delete(milestone);
	}

	@Override
	@Transactional(readOnly = true)
	public MilestoneResponse getMilestoneById(Long milestoneId, Long currentUserId, boolean isAdmin) {

		Milestone milestone = getMilestone(milestoneId);

		checkCanViewProject(milestone.getProject(), currentUserId, isAdmin);

		recalculateProgress(milestone);

		return toResponse(milestone);
	}

	@Override
	@Transactional(readOnly = true)
	public List<MilestoneResponse> getMilestonesByProject(Long projectId, Long currentUserId, boolean isAdmin) {

		Project project = getProject(projectId);

		checkCanViewProject(project, currentUserId, isAdmin);

		List<Milestone> milestones = milestoneRepository.findByProjectIdOrderByStartDateAsc(projectId);

		milestones.forEach(this::recalculateProgress);

		return milestones.stream().map(this::toResponse).toList();
	}

	@Override
	public void recalculateByTask(Long taskId) {

		List<Milestone> milestones = milestoneRepository.findDistinctByTaskId(taskId);

		for (Milestone milestone : milestones) {
			recalculateProgress(milestone);
		}
	}

	@Override
	public void recalculateMilestones(Set<Milestone> milestones) {

		if (milestones == null || milestones.isEmpty()) {
			return;
		}

		for (Milestone milestone : milestones) {
			recalculateProgress(milestone);
		}
	}

	private void recalculateProgress(Milestone milestone) {

		Set<Task> tasks = milestone.getTasks();

		if (tasks == null || tasks.isEmpty()) {
			milestone.setProgressPercent(0);
			return;
		}

		double average = tasks.stream()
				.mapToInt(task -> task.getProgressPercent() == null ? 0 : task.getProgressPercent()).average()
				.orElse(0);

		int progress = (int) Math.round(average);

		milestone.setProgressPercent(Math.min(Math.max(progress, 0), 100));
	}

	private Set<Task> loadAndValidateTasks(Project project, Set<Long> taskIds) {

		if (taskIds == null || taskIds.isEmpty()) {
			return new HashSet<>();
		}

		Set<Long> uniqueIds = new HashSet<>(taskIds);

		List<Task> tasks = taskRepository.findAllById(uniqueIds);

		if (tasks.size() != uniqueIds.size()) {
			throw new IllegalArgumentException("Một hoặc nhiều công việc không tồn tại");
		}

		boolean invalidProject = tasks.stream().anyMatch(task -> !task.getProject().getId().equals(project.getId()));

		if (invalidProject) {
			throw new IllegalArgumentException("Không thể gắn công việc thuộc dự án khác vào Milestone");
		}

		return new HashSet<>(tasks);
	}

	private void validateDates(LocalDate startDate, LocalDate endDate) {

		if (startDate == null || endDate == null) {
			throw new IllegalArgumentException("Ngày bắt đầu và ngày kết thúc không được để trống");
		}

		if (startDate.isAfter(endDate)) {
			throw new IllegalArgumentException("Ngày bắt đầu không được sau ngày kết thúc");
		}
	}

	private void validateProjectDateRange(Project project, LocalDate startDate, LocalDate endDate) {

		if (project.getStartDate() != null && startDate.isBefore(project.getStartDate())) {

			throw new IllegalArgumentException("Ngày bắt đầu Milestone không được trước ngày bắt đầu dự án");
		}

		if (project.getEndDate() != null && endDate.isAfter(project.getEndDate())) {

			throw new IllegalArgumentException("Ngày kết thúc Milestone không được sau ngày kết thúc dự án");
		}
	}

	private void validateNoOverlap(Long projectId, LocalDate startDate, LocalDate endDate, Long milestoneId) {

		List<Milestone> overlapping = milestoneRepository.findOverlappingMilestones(projectId, startDate, endDate,
				milestoneId);

		if (!overlapping.isEmpty()) {
			throw new IllegalArgumentException("Khoảng thời gian Milestone bị trùng với Milestone khác trong dự án");
		}
	}

	private void checkCanManageMilestone(Project project, Long currentUserId, boolean isAdmin) {

		if (isAdmin) {
			return;
		}

		if (project.getProjectManager() == null || !project.getProjectManager().getId().equals(currentUserId)) {

			throw new AccessDeniedException("Chỉ PM hoặc Admin mới có quyền quản lý Milestone");
		}
	}

	private void checkCanViewProject(Project project, Long currentUserId, boolean isAdmin) {

		if (isAdmin) {
			return;
		}

		if (project.getProjectManager() != null && project.getProjectManager().getId().equals(currentUserId)) {

			return;
		}

		boolean isMember = projectMemberRepository.existsByProjectIdAndUserId(project.getId(), currentUserId);

		if (!isMember) {
			throw new AccessDeniedException("Bạn không có quyền xem Milestone của dự án này");
		}
	}

	private void checkProjectEditable(Project project) {

		if (project.getStatus() == ProjectStatus.CLOSED || project.getStatus() == ProjectStatus.CANCELLED) {

			throw new IllegalStateException("Không thể thay đổi Milestone của dự án đã đóng hoặc đã hủy");
		}
	}

	private Project getProject(Long projectId) {

		return projectRepository.findById(projectId)
				.orElseThrow(() -> new IllegalArgumentException("Không tìm thấy dự án"));
	}

	private Milestone getMilestone(Long milestoneId) {

		return milestoneRepository.findById(milestoneId)
				.orElseThrow(() -> new IllegalArgumentException("Không tìm thấy Milestone"));
	}

	private MilestoneResponse toResponse(Milestone milestone) {

		List<Task> tasks = milestone.getTasks() == null ? List.of() : List.copyOf(milestone.getTasks());

		int completedTaskCount = (int) tasks.stream().filter(task -> task.getStatus() == TaskStatus.DONE).count();

		return MilestoneResponse.builder().id(milestone.getId()).name(milestone.getName())
				.startDate(milestone.getStartDate()).endDate(milestone.getEndDate())
				.progressPercent(milestone.getProgressPercent()).status(calculateStatus(milestone))
				.projectId(milestone.getProject().getId()).projectName(milestone.getProject().getName())
				.taskCount(tasks.size()).completedTaskCount(completedTaskCount)
				.taskIds(tasks.stream().map(Task::getId).toList()).createdAt(milestone.getCreatedAt())
				.updatedAt(milestone.getUpdatedAt()).build();
	}

	private String calculateStatus(Milestone milestone) {

		Integer progress = milestone.getProgressPercent() == null ? 0 : milestone.getProgressPercent();

		LocalDate today = LocalDate.now();

		if (progress >= 100) {
			return "COMPLETED";
		}

		if (today.isBefore(milestone.getStartDate())) {

			return "NOT_STARTED";
		}

		if (today.isAfter(milestone.getEndDate())) {

			return "OVERDUE";
		}

		return "IN_PROGRESS";
	}
}