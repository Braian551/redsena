package com.redsena.demo.posts.application;

import java.util.List;

public record CreatePostCommand(String content, List<String> mediaIds) {

	public String canonicalValue() {
		return (content == null ? "" : content.trim()) + "|" + String.join(",", mediaIds == null ? List.of() : mediaIds);
	}
}
