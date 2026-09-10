package com.redsena.demo.admin.application;

import com.redsena.demo.comments.infrastructure.CommentRepository;
import com.redsena.demo.likes.infrastructure.PostLikeRepository;
import com.redsena.demo.media.domain.PostMedia;
import com.redsena.demo.media.infrastructure.PostMediaRepository;
import com.redsena.demo.media.presentation.MediaView;
import com.redsena.demo.posts.application.PostDeletionService;
import com.redsena.demo.posts.domain.Post;
import com.redsena.demo.posts.infrastructure.PostRepository;
import com.redsena.demo.security.CurrentUserService;
import com.redsena.demo.security.AdminAccessService;
import com.redsena.demo.shared.exception.ApiException;
import com.redsena.demo.shared.pagination.Cursor;
import com.redsena.demo.users.domain.UserAccount;
import com.redsena.demo.users.infrastructure.UserAccountRepository;
import com.redsena.demo.users.presentation.UserView;
import com.redsena.demo.admin.presentation.AdminPostConnection;
import com.redsena.demo.admin.presentation.AdminPostView;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminPostService {

	private final PostRepository posts;
	private final PostMediaRepository media;
	private final PostLikeRepository likes;
	private final CommentRepository comments;
	private final UserAccountRepository users;
	private final CurrentUserService currentUser;
	private final AdminAccessService adminAccess;
	private final PostDeletionService deletion;
	private final int defaultPageSize;
	private final int maxPageSize;

	public AdminPostService(
			PostRepository posts,
			PostMediaRepository media,
			PostLikeRepository likes,
			CommentRepository comments,
			UserAccountRepository users,
			CurrentUserService currentUser,
			AdminAccessService adminAccess,
			PostDeletionService deletion,
			@Value("${app.feed.default-page-size:20}") int defaultPageSize,
			@Value("${app.feed.max-page-size:50}") int maxPageSize) {
		this.posts = posts;
		this.media = media;
		this.likes = likes;
		this.comments = comments;
		this.users = users;
		this.currentUser = currentUser;
		this.adminAccess = adminAccess;
		this.deletion = deletion;
		this.defaultPageSize = defaultPageSize;
		this.maxPageSize = maxPageSize;
	}

	@Transactional(readOnly = true)
	public AdminPostConnection page(Integer first, String after) {
		currentUser.requireAdmin();
		int limit = first == null ? defaultPageSize : Math.min(Math.max(first, 1), maxPageSize);
		List<Post> result;
		if (after == null || after.isBlank()) {
			result = posts.findFirstPage(PageRequest.of(0, limit + 1));
		} else {
			Cursor cursor = Cursor.decode(after);
			result = posts.findPageAfter(cursor.createdAt(), cursor.id(), PageRequest.of(0, limit + 1));
		}
		boolean hasNextPage = result.size() > limit;
		List<Post> page = result.subList(0, Math.min(result.size(), limit));
		return AdminPostConnection.of(map(page), hasNextPage);
	}

	@Transactional
	public boolean delete(String postId) {
		UserAccount admin = currentUser.requireAdmin();
		return deletion.deleteAsAdmin(postId, admin);
	}

	private List<AdminPostView> map(List<Post> page) {
		if (page.isEmpty()) {
			return List.of();
		}
		List<UUID> postIds = page.stream().map(Post::getId).toList();
		Map<UUID, List<PostMedia>> mediaByPost = media.findByPostIdInOrderByPositionAsc(postIds).stream()
				.collect(Collectors.groupingBy(item -> item.getPost().getId()));
		Map<UUID, Long> likeCounts = counts(likes.countByPostIds(postIds));
		Map<UUID, Long> commentCounts = counts(comments.countByPostIds(postIds));
		List<UUID> authorIds = page.stream().map(post -> post.getAuthor().getId()).distinct().toList();
		Map<UUID, UserView> authors = users.findAllById(authorIds).stream()
				.collect(Collectors.toMap(UserAccount::getId, user -> UserView.from(user, adminAccess.roleForEmail(user.getEmail()))));
		return page.stream().map(post -> new AdminPostView(
				post.getId().toString(),
				authors.get(post.getAuthor().getId()),
				post.getContent(),
				post.getCreatedAt().toString(),
				mediaByPost.getOrDefault(post.getId(), List.of()).stream()
						.map(item -> new MediaView(item.getId().toString(), "/media/" + item.getStorageKey(), item.getContentType(), item.getSize()))
						.toList(),
				likeCounts.getOrDefault(post.getId(), 0L),
				commentCounts.getOrDefault(post.getId(), 0L))).toList();
	}

	private static Map<UUID, Long> counts(List<Object[]> rows) {
		Map<UUID, Long> values = new HashMap<>();
		rows.forEach(row -> values.put((UUID) row[0], ((Number) row[1]).longValue()));
		return values;
	}
}
