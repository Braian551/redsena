package com.redsena.demo.admin.presentation;

import com.redsena.demo.feed.presentation.PageInfo;
import com.redsena.demo.shared.pagination.Cursor;
import java.io.Serializable;
import java.util.List;

public record AdminPostConnection(List<AdminPostView> nodes, PageInfo pageInfo) implements Serializable {

	public static AdminPostConnection of(List<AdminPostView> nodes, boolean hasNextPage) {
		String endCursor = nodes.isEmpty()
				? null
				: Cursor.encode(java.time.Instant.parse(nodes.get(nodes.size() - 1).createdAt()), java.util.UUID.fromString(nodes.get(nodes.size() - 1).id()));
		return new AdminPostConnection(nodes, new PageInfo(hasNextPage, endCursor));
	}
}
