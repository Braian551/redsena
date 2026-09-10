package com.redsena.demo.comments.application;

import com.redsena.demo.comments.infrastructure.CommentRepository;
import com.redsena.demo.comments.presentation.CommentView;
import com.redsena.demo.shared.exception.ApiException;
import com.redsena.demo.shared.idempotency.IdempotencyService;
import com.redsena.demo.security.AdminAccessService;
import com.redsena.demo.users.infrastructure.UserAccountRepository;
import com.redsena.demo.users.presentation.UserView;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommentService {

	private final CommentWriteService writer;
	private final CommentRepository comments;
	private final UserAccountRepository users;
	private final AdminAccessService adminAccess;
	private final IdempotencyService idempotency;

	public CommentService(CommentWriteService writer, CommentRepository comments, UserAccountRepository users, AdminAccessService adminAccess, IdempotencyService idempotency) {
		this.writer = writer;
		this.comments = comments;
		this.users = users;
		this.adminAccess = adminAccess;
		this.idempotency = idempotency;
	}

	public CommentView add(AddCommentCommand command, String idempotencyKey, String subject) {
		String hash = IdempotencyService.hash(command.canonicalValue());
		return idempotency.execute(
				subject,
				"create-comment",
				idempotencyKey,
				hash,
				() -> {
					CommentView created = writer.create(command);
					return new IdempotencyService.IdempotentResult<>(UUID.fromString(created.id()), created);
				},
				commentId -> comments.findById(commentId).map(CommentView::from).orElseThrow(() -> new ApiException("COMMENT_NOT_FOUND", "El comentario no existe.")));
	}

	public boolean delete(String commentId) {
		return writer.delete(commentId);
	}

	@Transactional(readOnly = true)
	public Map<CommentView, UserView> authors(List<CommentView> commentViews) {
		List<UUID> ids = commentViews.stream().map(CommentView::authorId).map(UUID::fromString).distinct().toList();
		Map<String, UserView> byId = users.findAllById(ids).stream().collect(Collectors.toMap(user -> user.getId().toString(), user -> UserView.from(user, adminAccess.roleForEmail(user.getEmail()))));
		return commentViews.stream().collect(Collectors.toMap(Function.identity(), comment -> byId.get(comment.authorId())));
	}
}
