package com.c2.project_management_system.service;

public interface ProjectProgressReportService {
	byte[] exportPdf(Long projectId, Long currentUserId, boolean isAdmin);

	byte[] exportExcel(Long projectId, Long currentUserId, boolean isAdmin);
}
