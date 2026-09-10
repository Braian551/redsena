package com.redsena.demo.comments.presentation;

import com.redsena.demo.comments.domain.Comment;
import java.io.Serializable;

public record CommentView(String id, String authorId, String content, String createdAt) implements Serializable {

	public static CommentView from(Comment comment) {
		return new CommentView(
				comment.getId().toString(),
				comment.getAuthor().getId().toString(),
				comment.getContent(),
				comment.getCreatedAt().toString());
	}
}
