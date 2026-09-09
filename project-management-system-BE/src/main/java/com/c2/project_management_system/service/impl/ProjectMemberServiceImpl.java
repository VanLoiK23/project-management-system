package com.c2.project_management_system.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.c2.project_management_system.dto.request.ProjectMemberAddRequest;
import com.c2.project_management_system.dto.request.ProjectMemberUpdateRoleRequest;
import com.c2.project_management_system.dto.respone.ProjectMemberResponse;
import com.c2.project_management_system.entity.Project;
import com.c2.project_management_system.entity.ProjectMember;
import com.c2.project_management_system.entity.Task;
import com.c2.project_management_system.entity.User;
import com.c2.project_management_system.exception.DuplicateResourceException;
import com.c2.project_management_system.exception.InvalidOperationException;
import com.c2.project_management_system.exception.ResourceNotFoundException;
import com.c2.project_management_system.repository.ProjectMemberRepository;
import com.c2.project_management_system.repository.ProjectRepository;
import com.c2.project_management_system.repository.TaskRepository;
import com.c2.project_management_system.repository.UserRepository;
import com.c2.project_management_system.service.ProjectMemberService;
import com.c2.project_management_system.statusEnum.TaskStatus;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Trien khai nghiep vu Module 3 - Quan ly thanh vien du an.
 *
 * Business rule bam sat tai lieu: - Them thanh vien: kiem tra thanh vien CHUA
 * ton tai trong du an truoc khi them (buoc 4 trong tai lieu). Viec "gui thong
 * bao moi tham gia" (buoc 5) duoc goi qua NotificationService o tang service
 * khac - danh cho module 9, o day chi de lai TODO hook de khong lan sang scope
 * module khac. - Xoa thanh vien: CANH BAO (nem loi ro rang) neu thanh vien con
 * task dang thuc hien (chua DONE/CANCELLED) trong du an do.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectMemberServiceImpl implements ProjectMemberService {

	private final ProjectRepository projectRepository;
	private final ProjectMemberRepository projectMemberRepository;
	private final UserRepository userRepository;
	private final TaskRepository taskRepository;

	@Override
	@Transactional
	public ProjectMemberResponse addMember(Long projectId, ProjectMemberAddRequest request) {
		Project project = getProjectOrThrow(projectId);

		User user = userRepository.findById(request.getUserId()).orElseThrow(
				() -> new ResourceNotFoundException("Không tìm thấy người dùng id=" + request.getUserId()));

		if (projectMemberRepository.existsByProjectAndUser(project, user)) {
			throw new DuplicateResourceException(
					"Người dùng '" + user.getFullName() + "' đã là thành viên của dự án này");
		}

		ProjectMember member = ProjectMember.builder().project(project).user(user).projectRole(request.getRole())
				.build();

		ProjectMember saved = projectMemberRepository.save(member);

		// TODO (module 9 - Quản lý thông báo): gọi NotificationService để gửi thông báo
		// mời tham gia dự án cho user này, ví dụ:
		// notificationService.notifyProjectInvitation(project, user);
		log.info("Đã thêm '{}' vào dự án '{}' với vai trò {}", user.getEmail(), project.getName(), request.getRole());

		return toResponse(saved);
	}

	@Override
	@Transactional
	public ProjectMemberResponse updateMemberRole(Long projectId, Long userId, ProjectMemberUpdateRoleRequest request) {
		ProjectMember member = getMemberOrThrow(projectId, userId);

		member.setProjectRole(request.getRole());
		ProjectMember saved = projectMemberRepository.save(member);

		log.info("Đã cập nhật vai trò thành viên '{}' trong dự án id={} thành {}", member.getUser().getEmail(),
				projectId, request.getRole());

		return toResponse(saved);
	}

	@Override
	@Transactional
	public void removeMember(Long projectId, Long userId) {
		Project project = getProjectOrThrow(projectId);
		ProjectMember member = getMemberOrThrow(projectId, userId);

		long ongoingTasks = taskRepository.findByProject(project).stream()
				.filter(t -> isAssignedTo(t, member.getUser()))
				.filter(t -> t.getStatus() != TaskStatus.DONE && t.getStatus() != TaskStatus.CANCELLED).count();

		if (ongoingTasks > 0) {
			throw new InvalidOperationException("Thành viên '" + member.getUser().getFullName() + "' còn "
					+ ongoingTasks + " công việc đang thực hiện trong dự án này. "
					+ "Vui lòng bàn giao/hoàn thành công việc trước khi xóa, hoặc xác nhận lại nếu vẫn muốn tiếp tục.");
		}

		projectMemberRepository.delete(member);
		log.info("Đã xóa '{}' khỏi dự án id={}, thu hồi quyền truy cập.", member.getUser().getEmail(), projectId);
	}

	@Override
	public List<ProjectMemberResponse> getMembers(Long projectId) {
		Project project = getProjectOrThrow(projectId);
		return projectMemberRepository.findByProject(project).stream().map(this::toResponse)
				.collect(Collectors.toList());
	}

	private boolean isAssignedTo(Task task, User user) {
		return task.getAssignees() != null && task.getAssignees().contains(user);
	}

	private Project getProjectOrThrow(Long projectId) {
		return projectRepository.findById(projectId)
				.orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dự án id=" + projectId));
	}

	private ProjectMember getMemberOrThrow(Long projectId, Long userId) {
		Project project = getProjectOrThrow(projectId);
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng id=" + userId));

		return projectMemberRepository.findByProjectAndUser(project, user)
				.orElseThrow(() -> new ResourceNotFoundException(
						"Người dùng '" + user.getFullName() + "' không phải là thành viên của dự án này"));
	}

	private ProjectMemberResponse toResponse(ProjectMember member) {
		return ProjectMemberResponse.builder().id(member.getId()).projectId(member.getProject().getId())
				.userId(member.getUser().getId()).userFullName(member.getUser().getFullName())
				.userEmail(member.getUser().getEmail()).role(member.getProjectRole()).joinedAt(member.getJoinedAt())
				.build();
	}
}
