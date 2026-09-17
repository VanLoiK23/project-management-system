package com.c2.project_management_system.controller;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.c2.project_management_system.entity.User;
import com.c2.project_management_system.service.ProjectProgressReportService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProjectProgressReportController {

	private final ProjectProgressReportService projectProgressReportService;

	@GetMapping("/projects/{projectId}/progress-report")
	public ResponseEntity<byte[]> exportProgressReport(@PathVariable Long projectId,
			@RequestParam(defaultValue = "pdf") String format, Authentication authentication) {

		User currentUser = (User) authentication.getPrincipal();

		boolean isAdmin = authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority)
				.anyMatch("ROLE_ADMIN"::equals);

		String normalizedFormat = format.trim().toLowerCase();

		byte[] file;
		String contentType;
		String fileName;

		switch (normalizedFormat) {

		case "pdf" -> {
			file = projectProgressReportService.exportPdf(projectId, currentUser.getId(), isAdmin);

			contentType = "application/pdf";
			fileName = "bao-cao-tien-do-du-an-" + projectId + ".pdf";
		}

		case "excel", "xlsx" -> {
			file = projectProgressReportService.exportExcel(projectId, currentUser.getId(), isAdmin);

			contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

			fileName = "bao-cao-tien-do-du-an-" + projectId + ".xlsx";
		}

		default -> throw new IllegalArgumentException("Định dạng báo cáo không hợp lệ. Chỉ hỗ trợ pdf hoặc excel");
		}

		HttpHeaders headers = new HttpHeaders();

		headers.setContentType(MediaType.parseMediaType(contentType));

		headers.setContentDisposition(ContentDisposition.attachment().filename(fileName).build());

		headers.setContentLength(file.length);

		return ResponseEntity.ok().headers(headers).body(file);
	}
}