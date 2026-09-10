package com.redsena.demo.comments.application;

import com.redsena.demo.comments.domain.Comment;
import com.redsena.demo.comments.infrastructure.CommentRepository;
import com.redsena.demo.comments.presentation.CommentView;
import com.redsena.demo.posts.infrastructure.PostRepository;
import com.redsena.demo.security.CurrentUserService;
import com.redsena.demo.shared.cache.CacheInvalidation;
import com.redsena.demo.shared.exception.ApiException;
import com.redsena.demo.shared.rate.RateLimitService;
import java.time.Duration;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommentWriteService {

	private final CommentRepository comments;
	private final PostRepository posts;
	private final CurrentUserService currentUser;
	private final RateLimitService rateLimit;
	private final CacheInvalidation cacheInvalidation;
	private final int commentCreateLimit;

	public CommentWriteService(CommentRepository comments, PostRepository posts, CurrentUserService currentUser, RateLimitService rateLimit, CacheInvalidation cacheInvalidation, @org.springframework.beans.factory.annotation.Value("${app.rate-limit.comment-create:30}") int commentCreateLimit) {
		this.comments = comments;
		this.posts = posts;
		this.currentUser = currentUser;
		this.rateLimit = rateLimit;
		this.cacheInvalidation = cacheInvalidation;
		this.commentCreateLimit = commentCreateLimit;
	}

	@Transactional
	public CommentView create(AddCommentCommand command) {
		if (command == null || command.content() == null || command.content().isBlank()) {
			throw new ApiException("COMMENT_CONTENT_REQUIRED", "Escribe un comentario antes de enviarlo.");
		}
		if (command.content().trim().length() > 280) {
			throw new ApiException("COMMENT_CONTENT_TOO_LONG", "El comentario no puede superar 280 caracteres.");
		}
		UUID postId = parsePostId(command.postId());
		var post = posts.findById(postId).orElseThrow(() -> new ApiException("POST_NOT_FOUND", "La publicación no existe."));
		String subject = currentUser.requireSubject();
		rateLimit.check("comment-create", subject, commentCreateLimit, Duration.ofMinutes(1));
		Comment comment = comments.save(new Comment(post, currentUser.requireUser(), command.content().trim()));
		cacheInvalidation.afterCommit(() -> cacheInvalidation.evictPost(postId.toString()));
		return CommentView.from(comment);
	}

	@Transactional
	public boolean delete(String commentId) {
		UUID id = parseCommentId(commentId);
		Comment comment = comments.findById(id).orElseThrow(() -> new ApiException("COMMENT_NOT_FOUND", "El comentario no existe."));
		if (!comment.getAuthor().getId().equals(currentUser.requireUser().getId())) {
			throw new ApiException("FORBIDDEN", "No tienes permiso para eliminar este comentario.");
		}
		comments.delete(comment);
		cacheInvalidation.afterCommit(() -> cacheInvalidation.evictPost(comment.getPost().getId().toString()));
		return true;
	}

	private UUID parsePostId(String id) {
		try {
			return UUID.fromString(id);
		} catch (RuntimeException exception) {
			throw new ApiException("POST_NOT_FOUND", "La publicación no existe.");
		}
	}

	private UUID parseCommentId(String id) {
		try {
			return UUID.fromString(id);
		} catch (RuntimeException exception) {
			throw new ApiException("COMMENT_NOT_FOUND", "El comentario no existe.");
		}
	}
}
