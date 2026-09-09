package com.c2.project_management_system.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.c2.project_management_system.dto.request.ProjectCreateRequest;
import com.c2.project_management_system.dto.request.ProjectUpdateRequest;
import com.c2.project_management_system.dto.respone.ProjectResponse;
import com.c2.project_management_system.entity.Project;
import com.c2.project_management_system.entity.ProjectMember;
import com.c2.project_management_system.entity.User;
import com.c2.project_management_system.exception.DuplicateResourceException;
import com.c2.project_management_system.exception.InvalidOperationException;
import com.c2.project_management_system.exception.ResourceNotFoundException;
import com.c2.project_management_system.repository.ProjectMemberRepository;
import com.c2.project_management_system.repository.ProjectRepository;
import com.c2.project_management_system.repository.TaskRepository;
import com.c2.project_management_system.repository.UserRepository;
import com.c2.project_management_system.service.ProjectService;
import com.c2.project_management_system.statusEnum.ProjectMemberRole;
import com.c2.project_management_system.statusEnum.ProjectStatus;
import com.c2.project_management_system.statusEnum.TaskStatus;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Trien khai nghiep vu Module 2 - Quan ly du an.
 *
 * Business rule bam sat tai lieu: - Them du an: kiem tra trung ten, ngay bat
 * dau phai truoc ngay ket thuc, luon khoi tao trang thai PLANNING. - Dong du
 * an: canh bao (nem loi ro rang) neu con cong viec chua hoan thanh, chi khi xac
 * nhan (confirmClosingWithUnfinishedTasks = true o tang controller/FE) hoac
 * khong con task nao dang do thi moi duoc chuyen CLOSED. - Xoa du an: CHI duoc
 * xoa neu du an dang o PLANNING hoac CLOSED; cac trang thai khac (IN_PROGRESS,
 * CANCELLED...) chi Admin moi duoc xoa.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

	private final ProjectRepository projectRepository;
	private final ProjectMemberRepository projectMemberRepository;
	private final UserRepository userRepository;
	private final TaskRepository taskRepository;

	@Override
	@Transactional
	public ProjectResponse createProject(Long currentUserId, ProjectCreateRequest request) {
		if (projectRepository.existsByName(request.getName())) {
			throw new DuplicateResourceException("Tên dự án đã tồn tại: " + request.getName());
		}

		if (request.getStartDate().isAfter(request.getEndDate())) {
			throw new InvalidOperationException("Ngày bắt đầu phải trước ngày kết thúc");
		}

		User projectManager = userRepository.findById(currentUserId)
				.orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người tạo dự án"));

		Project project = Project.builder().name(request.getName()).description(request.getDescription())
				.startDate(request.getStartDate()).endDate(request.getEndDate()).status(ProjectStatus.PLANNING)
				.projectManager(projectManager).build();

		Project saved = projectRepository.save(project);

		addMemberInternal(saved, projectManager, ProjectMemberRole.PM);

		if (request.getMemberIds() != null) {
			for (Long memberId : request.getMemberIds()) {
				if (memberId.equals(currentUserId)) {
					continue;
				}
				User member = userRepository.findById(memberId)
						.orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng id=" + memberId));
				addMemberInternal(saved, member, ProjectMemberRole.DEV);
			}
		}

		log.info("Đã tạo dự án mới '{}' (id={}) bởi user id={}", saved.getName(), saved.getId(), currentUserId);
		return toResponse(saved);
	}

	@Override
	@Transactional
	public ProjectResponse updateProject(Long projectId, Long currentUserId, ProjectUpdateRequest request) {
		Project project = getProjectOrThrow(projectId);

		if (project.getStatus() == ProjectStatus.CLOSED) {
			throw new InvalidOperationException("Dự án đã CLOSED, không thể chỉnh sửa");
		}

		if (!project.getName().equalsIgnoreCase(request.getName())
				&& projectRepository.existsByName(request.getName())) {
			throw new DuplicateResourceException("Tên dự án đã tồn tại: " + request.getName());
		}

		if (request.getStartDate().isAfter(request.getEndDate())) {
			throw new InvalidOperationException("Ngày bắt đầu phải trước ngày kết thúc");
		}

		project.setName(request.getName());
		project.setDescription(request.getDescription());
		project.setStartDate(request.getStartDate());
		project.setEndDate(request.getEndDate());

		Project saved = projectRepository.save(project);
		return toResponse(saved);
	}

	@Override
	@Transactional
	public ProjectResponse closeProject(Long projectId, Long currentUserId) {
		Project project = getProjectOrThrow(projectId);

		if (project.getStatus() == ProjectStatus.CLOSED) {
			throw new InvalidOperationException("Dự án đã ở trạng thái CLOSED rồi");
		}

		long unfinishedTasks = taskRepository.findByProject(project).stream()
				.filter(t -> t.getStatus() != TaskStatus.DONE && t.getStatus() != TaskStatus.CANCELLED).count();

		if (unfinishedTasks > 0) {
			throw new InvalidOperationException("Dự án còn " + unfinishedTasks + " công việc chưa hoàn thành. "
					+ "Vui lòng xác nhận lại nếu vẫn muốn đóng dự án.");
		}

		project.setStatus(ProjectStatus.CLOSED);
		Project saved = projectRepository.save(project);

		log.info("Dự án '{}' (id={}) đã được đóng bởi user id={}", saved.getName(), saved.getId(), currentUserId);
		return toResponse(saved);
	}

	@Override
	@Transactional
	public void deleteProject(Long projectId, Long currentUserId, boolean currentUserIsAdmin) {
		Project project = getProjectOrThrow(projectId);

		boolean deletableByAnyone = project.getStatus() == ProjectStatus.CLOSED
				|| project.getStatus() == ProjectStatus.PLANNING;

		if (!deletableByAnyone && !currentUserIsAdmin) {
			throw new InvalidOperationException("Chỉ có thể xóa dự án ở trạng thái PLANNING hoặc CLOSED. "
					+ "Dự án đang '" + project.getStatus() + "' chỉ Admin mới được xóa.");
		}

		log.warn("Xóa dự án '{}' (id={}) bởi user id={} - toàn bộ dữ liệu liên quan (task, tài liệu, "
				+ "thành viên...) sẽ bị xóa theo.", project.getName(), project.getId(), currentUserId);

		projectRepository.delete(project);
	}

	@Override
	public ProjectResponse getProjectById(Long projectId) {
		return toResponse(getProjectOrThrow(projectId));
	}

	@Override
	public List<ProjectResponse> getAllProjects() {
		return projectRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
	}

	private Project getProjectOrThrow(Long projectId) {
		return projectRepository.findById(projectId)
				.orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dự án id=" + projectId));
	}

	private void addMemberInternal(Project project, User user, ProjectMemberRole role) {
		ProjectMember member = ProjectMember.builder().project(project).user(user).projectRole(role).build();
		projectMemberRepository.save(member);
	}

	private ProjectResponse toResponse(Project project) {
		int memberCount = projectMemberRepository.findByProject(project).size();

		return ProjectResponse.builder().id(project.getId()).name(project.getName())
				.description(project.getDescription()).startDate(project.getStartDate()).endDate(project.getEndDate())
				.status(project.getStatus()).projectManagerId(project.getProjectManager().getId())
				.projectManagerName(project.getProjectManager().getFullName()).memberCount(memberCount)
				.createdAt(project.getCreatedAt()).updatedAt(project.getUpdatedAt()).build();
	}
}
