package com.c2.project_management_system.service.impl;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.c2.project_management_system.entity.Project;
import com.c2.project_management_system.entity.Task;
import com.c2.project_management_system.entity.User;
import com.c2.project_management_system.repository.ProjectMemberRepository;
import com.c2.project_management_system.repository.ProjectRepository;
import com.c2.project_management_system.repository.TaskRepository;
import com.c2.project_management_system.service.ProjectProgressReportService;
import com.c2.project_management_system.statusEnum.ProjectStatus;
import com.c2.project_management_system.statusEnum.TaskPriority;
import com.c2.project_management_system.statusEnum.TaskStatus;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectProgressReportServiceImpl implements ProjectProgressReportService {

	private final ProjectRepository projectRepository;
	private final ProjectMemberRepository projectMemberRepository;
	private final TaskRepository taskRepository;

	private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

	private static final DateTimeFormatter DATE_TIME_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

	@Override
	public byte[] exportPdf(Long projectId, Long currentUserId, boolean isAdmin) {

		Project project = getAuthorizedProject(projectId, currentUserId, isAdmin);

		List<Task> tasks = taskRepository.findByProjectId(projectId);

		try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

			Document document = new Document(PageSize.A4.rotate(), 28, 28, 28, 28);

			PdfWriter.getInstance(document, outputStream);

			document.open();

			BaseFont regularBaseFont = loadPdfFont("/fonts/NotoSans-Regular.ttf");

			BaseFont boldBaseFont = loadPdfFont("/fonts/NotoSans-Bold.ttf");

			// Tiêu đề chính của báo cáo (Tăng từ 18 -> 22 hoặc 24 cho nổi bật)
			Font titleFont = new Font(boldBaseFont, 22, Font.BOLD, new Color(31, 78, 121));

			// Tiêu đề các mục lớn/Section (Tăng từ 12 -> 14 hoặc 16)
			Font sectionFont = new Font(boldBaseFont, 14, Font.BOLD, new Color(31, 78, 121));

			// Tiêu đề cột/Nhãn bảng dữ liệu (Tăng từ 10 -> 11 hoặc 12)
			Font labelFont = new Font(boldBaseFont, 11, Font.BOLD, Color.BLACK);

			// Văn bản nội dung/Data trong bảng (Tăng từ 10 -> 11 để dễ đọc hơn trên bản in)
			Font textFont = new Font(regularBaseFont, 11, Font.NORMAL, Color.BLACK);

			// Chú thích nhỏ/Ghi chú (Tăng từ 8 -> 9 để tránh chữ quá bé khó đọc)
			Font smallFont = new Font(regularBaseFont, 9, Font.NORMAL, Color.BLACK);
			Font smallBoldFont = new Font(boldBaseFont, 9, Font.BOLD, Color.BLACK);

			// Tạo tiêu đề báo cáo
			Paragraph title = new Paragraph("BÁO CÁO TIẾN ĐỘ DỰ ÁN", titleFont);


			title.setAlignment(Element.ALIGN_CENTER);
			title.setSpacingAfter(18);

			document.add(title);

			addProjectInformation(document, project, labelFont, textFont);

			document.add(new Paragraph(" "));

			addStatistics(document, tasks, labelFont, textFont);

			document.add(new Paragraph(" "));

			Paragraph sectionTitle = new Paragraph("DANH SÁCH CÔNG VIỆC", sectionFont);

			sectionTitle.setSpacingBefore(8);
			sectionTitle.setSpacingAfter(8);

			document.add(sectionTitle);

			addTaskTable(document, tasks, regularBaseFont, boldBaseFont, smallFont, smallBoldFont);

			document.add(new Paragraph(" "));

			Paragraph footer = new Paragraph("Tổng số công việc: " + tasks.size(), textFont);

			document.add(footer);

			document.close();

			return outputStream.toByteArray();

		} catch (Exception e) {
			throw new RuntimeException("Không thể tạo báo cáo PDF", e);
		}
	}

	@Override
	public byte[] exportExcel(Long projectId, Long currentUserId, boolean isAdmin) {

		Project project = getAuthorizedProject(projectId, currentUserId, isAdmin);

		List<Task> tasks = taskRepository.findByProjectId(projectId);

		try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

			var sheet = workbook.createSheet("Báo cáo tiến độ");

			sheet.setDisplayGridlines(false);

			XSSFCellStyle titleStyle = createTitleStyle((XSSFWorkbook) workbook);

			XSSFCellStyle sectionStyle = createSectionStyle((XSSFWorkbook) workbook);

			XSSFCellStyle labelStyle = createLabelStyle((XSSFWorkbook) workbook);

			XSSFCellStyle valueStyle = createValueStyle((XSSFWorkbook) workbook);

			XSSFCellStyle headerStyle = createTableHeaderStyle((XSSFWorkbook) workbook);

			XSSFCellStyle textStyle = createTableTextStyle((XSSFWorkbook) workbook);

			XSSFCellStyle centerStyle = createTableCenterStyle((XSSFWorkbook) workbook);

			XSSFCellStyle progressStyle = createProgressStyle((XSSFWorkbook) workbook);

			int rowIndex = 0;

			var titleRow = sheet.createRow(rowIndex++);
			titleRow.setHeightInPoints(30);

			Cell titleCell = titleRow.createCell(0);
			titleCell.setCellValue("BÁO CÁO TIẾN ĐỘ DỰ ÁN");
			titleCell.setCellStyle(titleStyle);

			sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, 7));

			rowIndex++;

			rowIndex = addExcelProjectInformation(sheet, rowIndex, project, labelStyle, valueStyle);

			rowIndex++;

			rowIndex = addExcelStatistics(sheet, rowIndex, tasks, labelStyle, valueStyle);

			rowIndex++;

			var sectionRow = sheet.createRow(rowIndex++);

			Cell sectionCell = sectionRow.createCell(0);
			sectionCell.setCellValue("DANH SÁCH CÔNG VIỆC");
			sectionCell.setCellStyle(sectionStyle);

			sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowIndex - 1, rowIndex - 1, 0, 7));

			rowIndex++;

			String[] headers = { "STT", "Công việc", "Người thực hiện", "Ưu tiên", "Trạng thái", "Hạn hoàn thành",
					"Tiến độ", "Cập nhật" };

			var headerRow = sheet.createRow(rowIndex++);

			for (int i = 0; i < headers.length; i++) {

				Cell cell = headerRow.createCell(i);

				cell.setCellValue(headers[i]);

				cell.setCellStyle(headerStyle);
			}

			int stt = 1;

			for (Task task : tasks) {

				var row = sheet.createRow(rowIndex++);

				Cell sttCell = row.createCell(0);
				sttCell.setCellValue(stt++);
				sttCell.setCellStyle(centerStyle);

				Cell titleCellTask = row.createCell(1);
				titleCellTask.setCellValue(safe(task.getTitle()));
				titleCellTask.setCellStyle(textStyle);

				Cell assigneeCell = row.createCell(2);

				String assignees = task.getAssignees().stream().map(User::getFullName)
						.filter(name -> name != null && !name.isBlank()).collect(Collectors.joining(", "));

				assigneeCell.setCellValue(assignees.isBlank() ? "Chưa phân công" : assignees);

				assigneeCell.setCellStyle(textStyle);

				Cell priorityCell = row.createCell(3);

				priorityCell.setCellValue(mapPriority(task.getPriority()));

				priorityCell.setCellStyle(centerStyle);

				Cell statusCell = row.createCell(4);

				statusCell.setCellValue(mapTaskStatus(task.getStatus()));

				statusCell.setCellStyle(centerStyle);

				Cell deadlineCell = row.createCell(5);

				deadlineCell.setCellValue(formatDateTime(task.getDeadline()));

				deadlineCell.setCellStyle(centerStyle);

				Cell progressCell = row.createCell(6);

				progressCell.setCellValue(task.getProgressPercent() + "%");

				progressCell.setCellStyle(progressStyle);

				Cell updatedCell = row.createCell(7);

				updatedCell.setCellValue(formatDateTime(task.getUpdatedAt()));

				updatedCell.setCellStyle(centerStyle);

				row.setHeightInPoints(24);
			}

			int[] widths = { 8, 34, 28, 16, 20, 23, 14, 23 };

			for (int i = 0; i < widths.length; i++) {
				sheet.setColumnWidth(i, widths[i] * 256);
			}

			sheet.createFreezePane(0, rowIndex - tasks.size());

			sheet.setAutoFilter(
					new org.apache.poi.ss.util.CellRangeAddress(rowIndex - tasks.size() - 1, rowIndex - 1, 0, 7));

			workbook.write(outputStream);

			return outputStream.toByteArray();

		} catch (Exception e) {
			throw new RuntimeException("Không thể tạo báo cáo Excel", e);
		}
	}

	private void addProjectInformation(Document document, Project project, Font labelFont, Font textFont) {

		Paragraph projectName = new Paragraph();

		projectName.add(new Phrase("Tên dự án: ", labelFont));

		projectName.add(new Phrase(safe(project.getName()), textFont));

		projectName.setSpacingAfter(5);

		document.add(projectName);

		Paragraph manager = new Paragraph();

		manager.add(new Phrase("Quản lý dự án: ", labelFont));

		manager.add(new Phrase(
				project.getProjectManager() == null ? "Chưa xác định" : safe(project.getProjectManager().getFullName()),
				textFont));

		manager.setSpacingAfter(5);

		document.add(manager);

		Paragraph period = new Paragraph();

		period.add(new Phrase("Thời gian: ", labelFont));

		period.add(new Phrase(formatDate(project.getStartDate()) + " - " + formatDate(project.getEndDate()), textFont));

		period.setSpacingAfter(5);

		document.add(period);

		Paragraph status = new Paragraph();

		status.add(new Phrase("Trạng thái: ", labelFont));

		status.add(new Phrase(mapProjectStatus(project.getStatus()), textFont));

		document.add(status);
	}

	private void addStatistics(Document document, List<Task> tasks, Font labelFont, Font textFont) {

		long notStarted = tasks.stream().filter(t -> t.getStatus() == TaskStatus.NOT_STARTED).count();

		long inProgress = tasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count();

		long pending = tasks.stream().filter(t -> t.getStatus() == TaskStatus.PENDING).count();

		long completed = tasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();

		long cancelled = tasks.stream().filter(t -> t.getStatus() == TaskStatus.CANCELLED).count();

		double progress = tasks.isEmpty() ? 0 : tasks.stream().mapToInt(Task::getProgressPercent).average().orElse(0);

		addStatisticLine(document, "Tổng số công việc: ", String.valueOf(tasks.size()), labelFont, textFont);

		addStatisticLine(document, "Chưa bắt đầu: ", String.valueOf(notStarted), labelFont, textFont);

		addStatisticLine(document, "Đang thực hiện: ", String.valueOf(inProgress), labelFont, textFont);

		addStatisticLine(document, "Đang chờ: ", String.valueOf(pending), labelFont, textFont);

		addStatisticLine(document, "Hoàn thành: ", String.valueOf(completed), labelFont, textFont);

		addStatisticLine(document, "Đã hủy: ", String.valueOf(cancelled), labelFont, textFont);

		addStatisticLine(document, "Tiến độ tổng: ", String.format("%.1f%%", progress), labelFont, textFont);
	}

	private void addStatisticLine(Document document, String label, String value, Font labelFont, Font textFont) {

		Paragraph paragraph = new Paragraph();

		paragraph.add(new Phrase(label, labelFont));

		paragraph.add(new Phrase(value, textFont));

		paragraph.setSpacingAfter(3);

		document.add(paragraph);
	}

	private void addTaskTable(Document document, List<Task> tasks, BaseFont regularBaseFont, BaseFont boldBaseFont,
			Font smallFont, Font smallBoldFont) {

		PdfPTable table = new PdfPTable(8);

		table.setWidthPercentage(100);

		table.setWidths(new float[] { 5, 25, 19, 11, 15, 15, 10, 16 });

		table.setHeaderRows(1);

		String[] headers = { "STT", "Công việc", "Người thực hiện", "Ưu tiên", "Trạng thái", "Hạn hoàn thành",
				"Tiến độ", "Cập nhật" };

		for (String header : headers) {

			PdfPCell cell = new PdfPCell(new Phrase(header, smallBoldFont));

			cell.setBackgroundColor(new Color(31, 78, 121));

			cell.setHorizontalAlignment(Element.ALIGN_CENTER);

			cell.setVerticalAlignment(Element.ALIGN_MIDDLE);

			cell.setPadding(6);

			table.addCell(cell);
		}

		int index = 1;

		for (Task task : tasks) {

			addPdfCell(table, String.valueOf(index++), smallFont, Element.ALIGN_CENTER);

			addPdfCell(table, safe(task.getTitle()), smallFont, Element.ALIGN_LEFT);

			String assignees = task.getAssignees().stream().map(User::getFullName)
					.filter(name -> name != null && !name.isBlank()).collect(Collectors.joining(", "));

			addPdfCell(table, assignees.isBlank() ? "Chưa phân công" : assignees, smallFont, Element.ALIGN_LEFT);

			addPdfCell(table, mapPriority(task.getPriority()), smallFont, Element.ALIGN_CENTER);

			addPdfCell(table, mapTaskStatus(task.getStatus()), smallFont, Element.ALIGN_CENTER);

			addPdfCell(table, formatDateTime(task.getDeadline()), smallFont, Element.ALIGN_CENTER);

			addPdfCell(table, task.getProgressPercent() + "%", smallBoldFont, Element.ALIGN_CENTER);

			addPdfCell(table, formatDateTime(task.getUpdatedAt()), smallFont, Element.ALIGN_CENTER);
		}

		document.add(table);
	}

	private void addPdfCell(PdfPTable table, String value, Font font, int alignment) {

		PdfPCell cell = new PdfPCell(new Phrase(safe(value), font));

		cell.setHorizontalAlignment(alignment);
		cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
		cell.setPadding(5);

		table.addCell(cell);
	}

	private int addExcelProjectInformation(org.apache.poi.ss.usermodel.Sheet sheet, int rowIndex, Project project,
			CellStyle labelStyle, CellStyle valueStyle) {

		addExcelInfoRow(sheet, rowIndex++, "Tên dự án", safe(project.getName()), labelStyle, valueStyle);

		addExcelInfoRow(sheet, rowIndex++, "Quản lý dự án",
				project.getProjectManager() == null ? "Chưa xác định" : safe(project.getProjectManager().getFullName()),
				labelStyle, valueStyle);

		addExcelInfoRow(sheet, rowIndex++, "Thời gian",
				formatDate(project.getStartDate()) + " - " + formatDate(project.getEndDate()), labelStyle, valueStyle);

		addExcelInfoRow(sheet, rowIndex++, "Trạng thái", mapProjectStatus(project.getStatus()), labelStyle, valueStyle);

		return rowIndex;
	}

	private void addExcelInfoRow(org.apache.poi.ss.usermodel.Sheet sheet, int rowIndex, String label, String value,
			CellStyle labelStyle, CellStyle valueStyle) {

		var row = sheet.createRow(rowIndex);

		Cell labelCell = row.createCell(0);
		labelCell.setCellValue(label);
		labelCell.setCellStyle(labelStyle);

		Cell valueCell = row.createCell(1);
		valueCell.setCellValue(value);
		valueCell.setCellStyle(valueStyle);

		sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowIndex, rowIndex, 1, 7));
	}

	private int addExcelStatistics(org.apache.poi.ss.usermodel.Sheet sheet, int rowIndex, List<Task> tasks,
			CellStyle labelStyle, CellStyle valueStyle) {

		long notStarted = tasks.stream().filter(t -> t.getStatus() == TaskStatus.NOT_STARTED).count();

		long inProgress = tasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count();

		long pending = tasks.stream().filter(t -> t.getStatus() == TaskStatus.PENDING).count();

		long completed = tasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();

		long cancelled = tasks.stream().filter(t -> t.getStatus() == TaskStatus.CANCELLED).count();

		double progress = tasks.isEmpty() ? 0 : tasks.stream().mapToInt(Task::getProgressPercent).average().orElse(0);

		String[][] statistics = { { "Tổng số công việc", String.valueOf(tasks.size()) },
				{ "Chưa bắt đầu", String.valueOf(notStarted) }, { "Đang thực hiện", String.valueOf(inProgress) },
				{ "Đang chờ", String.valueOf(pending) }, { "Hoàn thành", String.valueOf(completed) },
				{ "Đã hủy", String.valueOf(cancelled) }, { "Tiến độ tổng", String.format("%.1f%%", progress) } };

		for (String[] statistic : statistics) {

			addExcelInfoRow(sheet, rowIndex++, statistic[0], statistic[1], labelStyle, valueStyle);
		}

		return rowIndex;
	}

	private XSSFCellStyle createTitleStyle(XSSFWorkbook workbook) {

		XSSFCellStyle style = (XSSFCellStyle) workbook.createCellStyle();

		XSSFFont font = workbook.createFont();

		font.setFontName("Arial");
		font.setFontHeightInPoints((short) 18);
		font.setBold(true);
		font.setColor(new XSSFColor(new byte[] { 31, 78, 121 }, null));

		style.setFont(font);

		style.setAlignment(HorizontalAlignment.CENTER);

		style.setVerticalAlignment(VerticalAlignment.CENTER);

		return style;
	}

	private XSSFCellStyle createSectionStyle(XSSFWorkbook workbook) {

		XSSFCellStyle style = (XSSFCellStyle) workbook.createCellStyle();

		XSSFFont font = workbook.createFont();

		font.setFontName("Arial");
		font.setFontHeightInPoints((short) 12);
		font.setBold(true);
		font.setColor(new XSSFColor(new byte[] { 31, 78, 121 }, null));

		style.setFont(font);

		style.setAlignment(HorizontalAlignment.LEFT);

		style.setVerticalAlignment(VerticalAlignment.CENTER);

		style.setFillForegroundColor(new XSSFColor(new byte[] { (byte) 221, (byte) 235, (byte) 247 }, null));

		style.setFillPattern(FillPatternType.SOLID_FOREGROUND);

		return style;
	}

	private XSSFCellStyle createLabelStyle(XSSFWorkbook workbook) {

		XSSFCellStyle style = (XSSFCellStyle) workbook.createCellStyle();

		XSSFFont font = workbook.createFont();

		font.setFontName("Arial");
		font.setFontHeightInPoints((short) 10);
		font.setBold(true);
		font.setColor(IndexedColors.BLACK.getIndex());

		style.setFont(font);

		style.setVerticalAlignment(VerticalAlignment.CENTER);

		return style;
	}

	private XSSFCellStyle createValueStyle(XSSFWorkbook workbook) {

		XSSFCellStyle style = (XSSFCellStyle) workbook.createCellStyle();

		XSSFFont font = workbook.createFont();

		font.setFontName("Arial");
		font.setFontHeightInPoints((short) 10);
		font.setColor(IndexedColors.BLACK.getIndex());

		style.setFont(font);

		style.setVerticalAlignment(VerticalAlignment.CENTER);

		return style;
	}

	private XSSFCellStyle createTableHeaderStyle(XSSFWorkbook workbook) {

		XSSFCellStyle style = (XSSFCellStyle) workbook.createCellStyle();

		XSSFFont font = workbook.createFont();

		font.setFontName("Arial");
		font.setFontHeightInPoints((short) 10);
		font.setBold(true);

		// Chữ TRẮNG để không bị chữ đen trên nền đen.
		font.setColor(IndexedColors.WHITE.getIndex());

		style.setFont(font);

		style.setFillForegroundColor(new XSSFColor(new byte[] { 31, 78, 121 }, null));

		style.setFillPattern(FillPatternType.SOLID_FOREGROUND);

		style.setAlignment(HorizontalAlignment.CENTER);

		style.setVerticalAlignment(VerticalAlignment.CENTER);

		setBorders(style);

		return style;
	}

	private XSSFCellStyle createTableTextStyle(XSSFWorkbook workbook) {

		XSSFCellStyle style = (XSSFCellStyle) workbook.createCellStyle();

		XSSFFont font = workbook.createFont();

		font.setFontName("Arial");
		font.setFontHeightInPoints((short) 10);
		font.setColor(IndexedColors.BLACK.getIndex());

		style.setFont(font);

		style.setVerticalAlignment(VerticalAlignment.CENTER);

		style.setWrapText(true);

		setBorders(style);

		return style;
	}

	private XSSFCellStyle createTableCenterStyle(XSSFWorkbook workbook) {

		XSSFCellStyle style = createTableTextStyle(workbook);

		style.setAlignment(HorizontalAlignment.CENTER);

		return style;
	}

	private XSSFCellStyle createProgressStyle(XSSFWorkbook workbook) {

		XSSFCellStyle style = createTableCenterStyle(workbook);

		XSSFFont font = workbook.createFont();

		font.setFontName("Arial");
		font.setFontHeightInPoints((short) 10);
		font.setBold(true);
		font.setColor(IndexedColors.BLACK.getIndex());

		style.setFont(font);

		return style;
	}

	private void setBorders(XSSFCellStyle style) {

		style.setBorderTop(BorderStyle.THIN);

		style.setBorderBottom(BorderStyle.THIN);

		style.setBorderLeft(BorderStyle.THIN);

		style.setBorderRight(BorderStyle.THIN);
	}

	private BaseFont loadPdfFont(String resourcePath) throws IOException {

		try (InputStream inputStream = getClass().getResourceAsStream(resourcePath)) {

			if (inputStream == null) {
				throw new IOException("Không tìm thấy font: " + resourcePath);
			}

			byte[] fontBytes = inputStream.readAllBytes();

			return BaseFont.createFont(resourcePath, BaseFont.IDENTITY_H, BaseFont.EMBEDDED, true, fontBytes, null);
		}
	}

	private Project getAuthorizedProject(Long projectId, Long currentUserId, boolean isAdmin) {

		Project project = projectRepository.findById(projectId)
				.orElseThrow(() -> new RuntimeException("Không tìm thấy dự án"));

		if (isAdmin) {
			return project;
		}

		if (project.getProjectManager() != null && project.getProjectManager().getId().equals(currentUserId)) {
			return project;
		}

		boolean isMember = projectMemberRepository.existsByProjectIdAndUserId(projectId, currentUserId);

		if (!isMember) {
			throw new AccessDeniedException("Bạn không có quyền xem báo cáo của dự án này");
		}

		return project;
	}

	private String mapProjectStatus(ProjectStatus status) {

		if (status == null) {
			return "Chưa xác định";
		}

		return switch (status) {
		case PLANNING -> "Lập kế hoạch";
		case IN_PROGRESS -> "Đang thực hiện";
		case ON_HOLD -> "Tạm dừng";
		case COMPLETED -> "Hoàn thành";
		case CLOSED -> "Đã đóng";
		case CANCELLED -> "Đã hủy";
		};
	}

	private String mapTaskStatus(TaskStatus status) {

		if (status == null) {
			return "Chưa xác định";
		}

		return switch (status) {
		case NOT_STARTED -> "Chưa bắt đầu";
		case IN_PROGRESS -> "Đang thực hiện";
		case PENDING -> "Đang chờ";
		case DONE -> "Hoàn thành";
		case CANCELLED -> "Đã hủy";
		};
	}

	private String mapPriority(TaskPriority priority) {

		if (priority == null) {
			return "Chưa xác định";
		}

		return switch (priority) {
		case LOW -> "Thấp";
		case MEDIUM -> "Trung bình";
		case HIGH -> "Cao";
		case URGENT -> "Khẩn cấp";
		};
	}

	private String formatDate(LocalDate date) {

		return date == null ? "Chưa xác định" : DATE_FORMAT.format(date);
	}

	private String formatDateTime(LocalDateTime dateTime) {

		return dateTime == null ? "Chưa xác định" : DATE_TIME_FORMAT.format(dateTime);
	}

	private String safe(String value) {

		return value == null || value.isBlank() ? "Chưa có" : value;
	}
}