package com.redsena.demo.comments.application;

public record AddCommentCommand(String postId, String content) {

	public String canonicalValue() {
		return (postId == null ? "" : postId) + "|" + (content == null ? "" : content.trim());
	}
}
