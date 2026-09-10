package com.redsena.demo.admin.presentation;

import com.redsena.demo.media.presentation.MediaView;
import com.redsena.demo.users.presentation.UserView;
import java.io.Serializable;
import java.util.List;

public record AdminPostView(
		String id,
		UserView author,
		String content,
		String createdAt,
		List<MediaView> media,
		long likeCount,
		long commentCount) implements Serializable {
}
