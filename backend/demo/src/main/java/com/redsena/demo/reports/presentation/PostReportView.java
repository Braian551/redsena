package com.redsena.demo.reports.presentation;

import com.redsena.demo.reports.domain.PostReport;
import com.redsena.demo.reports.domain.ReportReason;
import com.redsena.demo.reports.domain.ReportStatus;
import java.io.Serializable;

public record PostReportView(String id, ReportReason reason, ReportStatus status, String createdAt) implements Serializable {

	public static PostReportView from(PostReport report) {
		return new PostReportView(
				report.getId().toString(),
				report.getReason(),
				report.getStatus(),
				report.getCreatedAt().toString());
	}
}
