package com.redsena.demo.comments.presentation;

import com.redsena.demo.comments.application.AddCommentCommand;
import com.redsena.demo.comments.application.CommentService;
import com.redsena.demo.security.CurrentUserService;
import java.util.List;
import java.util.Map;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.BatchMapping;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.stereotype.Controller;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Controller
public class CommentGraphQlController {

	private final CommentService comments;
	private final CurrentUserService currentUser;

	public CommentGraphQlController(CommentService comments, CurrentUserService currentUser) {
		this.comments = comments;
		this.currentUser = currentUser;
	}

	@MutationMapping
	public CommentView addComment(@Argument AddCommentInput input) {
		String subject = currentUser.requireSubject();
		return comments.add(new AddCommentCommand(input.postId(), input.content()), idempotencyKey(), subject);
	}

	@MutationMapping
	public boolean deleteComment(@Argument String id) {
		return comments.delete(id);
	}

	@BatchMapping(typeName = "Comment", field = "author")
	public Map<CommentView, com.redsena.demo.users.presentation.UserView> author(List<CommentView> commentViews) {
		return comments.authors(commentViews);
	}

	private String idempotencyKey() {
		if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes) {
			return attributes.getRequest().getHeader("Idempotency-Key");
		}
		return null;
	}
}
