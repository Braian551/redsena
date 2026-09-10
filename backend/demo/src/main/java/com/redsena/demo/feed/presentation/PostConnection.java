package com.redsena.demo.feed.presentation;

import com.redsena.demo.posts.presentation.PostView;
import com.redsena.demo.shared.pagination.Cursor;
import java.io.Serializable;
import java.util.List;

public record PostConnection(List<PostView> nodes, PageInfo pageInfo) implements Serializable {

	public static PostConnection of(List<PostView> nodes, boolean hasNextPage) {
		String endCursor = nodes.isEmpty()
				? null
				: Cursor.encode(java.time.Instant.parse(nodes.get(nodes.size() - 1).createdAt()), java.util.UUID.fromString(nodes.get(nodes.size() - 1).id()));
		return new PostConnection(nodes, new PageInfo(hasNextPage, endCursor));
	}
}
