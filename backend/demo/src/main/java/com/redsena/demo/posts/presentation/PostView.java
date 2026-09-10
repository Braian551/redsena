package com.redsena.demo.posts.presentation;

import com.redsena.demo.media.domain.PostMedia;
import com.redsena.demo.media.presentation.MediaView;
import com.redsena.demo.posts.domain.Post;
import java.io.Serializable;
import java.util.List;

public record PostView(String id, String authorId, String content, String createdAt, List<MediaView> media) implements Serializable {

	public static PostView from(Post post, List<PostMedia> media) {
		return new PostView(
				post.getId().toString(),
				post.getAuthor().getId().toString(),
				post.getContent(),
				post.getCreatedAt().toString(),
				media.stream()
						.map(item -> new MediaView(item.getId().toString(), "/media/" + item.getStorageKey(), item.getContentType(), item.getSize()))
						.toList());
	}
}
