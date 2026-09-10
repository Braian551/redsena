package com.redsena.demo.reports.domain;

import com.redsena.demo.posts.domain.Post;
import com.redsena.demo.users.domain.UserAccount;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "post_reports", uniqueConstraints = @UniqueConstraint(
		name = "uk_post_reports_post_reporter", columnNames = { "post_id", "reporter_id" }))
public class PostReport {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "post_id", nullable = false)
	private Post post;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "reporter_id", nullable = false)
	private UserAccount reporter;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 40)
	private ReportReason reason;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private ReportStatus status;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	protected PostReport() {
	}

	public PostReport(Post post, UserAccount reporter, ReportReason reason) {
		this.id = UUID.randomUUID();
		this.post = post;
		this.reporter = reporter;
		this.reason = reason;
		this.status = ReportStatus.OPEN;
	}

	@PrePersist
	void initializeCreatedAt() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
	}

	public UUID getId() {
		return id;
	}

	public Post getPost() {
		return post;
	}

	public UserAccount getReporter() {
		return reporter;
	}

	public ReportReason getReason() {
		return reason;
	}

	public ReportStatus getStatus() {
		return status;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
