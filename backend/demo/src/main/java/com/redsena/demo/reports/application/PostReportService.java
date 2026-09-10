package com.redsena.demo.reports.application;

import com.redsena.demo.posts.application.PostAction;
import com.redsena.demo.posts.application.PostActionAuthorizer;
import com.redsena.demo.posts.domain.Post;
import com.redsena.demo.posts.infrastructure.PostRepository;
import com.redsena.demo.reports.domain.PostReport;
import com.redsena.demo.reports.presentation.PostReportView;
import com.redsena.demo.reports.presentation.ReportPostInput;
import com.redsena.demo.reports.infrastructure.PostReportRepository;
import com.redsena.demo.security.CurrentUserService;
import com.redsena.demo.shared.exception.ApiException;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PostReportService {

	private final PostRepository posts;
	private final PostReportRepository reports;
	private final CurrentUserService currentUser;
	private final PostActionAuthorizer authorizer;

	public PostReportService(
			PostRepository posts,
			PostReportRepository reports,
			CurrentUserService currentUser,
			PostActionAuthorizer authorizer) {
		this.posts = posts;
		this.reports = reports;
		this.currentUser = currentUser;
		this.authorizer = authorizer;
	}

	@Transactional
	public PostReportView report(ReportPostInput input) {
		if (input == null || input.reason() == null) {
			throw new ApiException("POST_REPORT_REASON_REQUIRED", "Selecciona un motivo para el reporte.");
		}
		UUID postId = parsePostId(input.postId());
		Post post = posts.findById(postId)
				.orElseThrow(() -> new ApiException("POST_NOT_FOUND", "La publicación no existe."));
		var reporter = currentUser.requireUser();
		authorizer.authorize(PostAction.REPORT, post, reporter);
		if (reports.existsByPost_IdAndReporter_Id(postId, reporter.getId())) {
			throw new ApiException("POST_ALREADY_REPORTED", "Ya reportaste esta publicación.");
		}
		return PostReportView.from(reports.save(new PostReport(post, reporter, input.reason())));
	}

	private UUID parsePostId(String id) {
		try {
			return UUID.fromString(id);
		} catch (RuntimeException exception) {
			throw new ApiException("POST_NOT_FOUND", "La publicación no existe.");
		}
	}
}
