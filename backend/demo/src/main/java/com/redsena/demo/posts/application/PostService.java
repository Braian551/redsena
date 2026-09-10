package com.redsena.demo.posts.application;

import com.redsena.demo.comments.infrastructure.CommentRepository;
import com.redsena.demo.comments.presentation.CommentView;
import com.redsena.demo.likes.infrastructure.PostLikeRepository;
import com.redsena.demo.media.domain.PostMedia;
import com.redsena.demo.media.infrastructure.PostMediaRepository;
import com.redsena.demo.posts.domain.Post;
import com.redsena.demo.posts.infrastructure.PostRepository;
import com.redsena.demo.posts.presentation.PostView;
import com.redsena.demo.security.CurrentUserService;
import com.redsena.demo.shared.exception.ApiException;
import com.redsena.demo.shared.idempotency.IdempotencyService;
import com.redsena.demo.shared.pagination.Cursor;
import com.redsena.demo.users.domain.UserAccount;
import com.redsena.demo.users.infrastructure.UserAccountRepository;
import com.redsena.demo.users.presentation.UserView;
import com.redsena.demo.feed.presentation.PostConnection;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PostService {

	private final PostRepository posts;
	private final PostMediaRepository media;
	private final CommentRepository comments;
	private final PostLikeRepository likes;
	private final UserAccountRepository users;
	private final CurrentUserService currentUser;
	private final PostWriteService writer;
	private final IdempotencyService idempotency;
	private final int defaultPageSize;
	private final int maxPageSize;

	public PostService(
			PostRepository posts,
			PostMediaRepository media,
			CommentRepository comments,
			PostLikeRepository likes,
			UserAccountRepository users,
			CurrentUserService currentUser,
			PostWriteService writer,
			IdempotencyService idempotency,
			@Value("${app.feed.default-page-size:20}") int defaultPageSize,
			@Value("${app.feed.max-page-size:50}") int maxPageSize) {
		this.posts = posts;
		this.media = media;
		this.comments = comments;
		this.likes = likes;
		this.users = users;
		this.currentUser = currentUser;
		this.writer = writer;
		this.idempotency = idempotency;
		this.defaultPageSize = defaultPageSize;
		this.maxPageSize = maxPageSize;
	}

	public PostView create(CreatePostCommand command, String idempotencyKey) {
		String subject = currentUser.requireSubject();
		String hash = IdempotencyService.hash(command.canonicalValue());
		return idempotency.execute(
				subject,
				"create-post",
				idempotencyKey,
				hash,
				() -> {
					PostView created = writer.create(command);
					return new IdempotencyService.IdempotentResult<>(UUID.fromString(created.id()), created);
				},
				postId -> findPost(postId.toString()));
	}

	public boolean delete(String postId) {
		return writer.delete(postId);
	}

	@Cacheable(cacheNames = "posts", key = "#postId + ':' + #root.target.cacheViewerKey()")
	@Transactional(readOnly = true)
	public PostView findPost(String postId) {
		UUID id = parsePostId(postId);
		Post post = posts.findById(id).orElse(null);
		if (post == null) {
			return null;
		}
		return mapPosts(List.of(post)).get(0);
	}

	@Cacheable(cacheNames = "feed", key = "#first + ':' + (#after == null ? '' : #after) + ':' + #root.target.cacheViewerKey()")
	@Transactional(readOnly = true)
	public PostConnection feed(Integer first, String after) {
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
		return PostConnection.of(mapPosts(page), hasNextPage);
	}

	@Transactional(readOnly = true)
	public Map<PostView, UserView> authors(List<PostView> postViews) {
		List<UUID> ids = postViews.stream().map(PostView::authorId).map(UUID::fromString).distinct().toList();
		Map<String, UserView> byId = users.findAllById(ids).stream().collect(Collectors.toMap(user -> user.getId().toString(), UserView::from));
		return postViews.stream().collect(Collectors.toMap(Function.identity(), post -> byId.get(post.authorId())));
	}

	@Transactional(readOnly = true)
	public Map<PostView, Long> likeCounts(List<PostView> postViews) {
		List<UUID> ids = postIds(postViews);
		Map<UUID, Long> counts = new HashMap<>();
		likes.countByPostIds(ids).forEach(row -> counts.put((UUID) row[0], ((Number) row[1]).longValue()));
		return postViews.stream().collect(Collectors.toMap(Function.identity(), post -> counts.getOrDefault(UUID.fromString(post.id()), 0L)));
	}

	@Transactional(readOnly = true)
	public Map<PostView, Long> commentCounts(List<PostView> postViews) {
		List<UUID> ids = postIds(postViews);
		Map<UUID, Long> counts = new HashMap<>();
		comments.countByPostIds(ids).forEach(row -> counts.put((UUID) row[0], ((Number) row[1]).longValue()));
		return postViews.stream().collect(Collectors.toMap(Function.identity(), post -> counts.getOrDefault(UUID.fromString(post.id()), 0L)));
	}

	@Transactional(readOnly = true)
	public Map<PostView, Boolean> likedByViewer(List<PostView> postViews) {
		Map<PostView, Boolean> result = new HashMap<>();
		postViews.forEach(post -> result.put(post, false));
		currentUser.findUser().ifPresent(user -> likes.findLikedPostIds(user.getId(), postIds(postViews)).forEach(id ->
				postViews.stream().filter(post -> post.id().equals(id.toString())).findFirst().ifPresent(post -> result.put(post, true))));
		return result;
	}

	@Transactional(readOnly = true)
	public Map<PostView, List<CommentView>> comments(List<PostView> postViews) {
		List<UUID> ids = postIds(postViews);
		Map<UUID, List<CommentView>> byPost = new HashMap<>();
		comments.findFirstPageForPosts(ids, 20).forEach(comment -> byPost.computeIfAbsent(comment.getPost().getId(), ignored -> new java.util.ArrayList<>()).add(CommentView.from(comment)));
		return postViews.stream().collect(Collectors.toMap(Function.identity(), post -> byPost.getOrDefault(UUID.fromString(post.id()), List.of())));
	}

	public String cacheViewerKey() {
		return currentUser.cacheKey();
	}

	private List<PostView> mapPosts(List<Post> postEntities) {
		if (postEntities.isEmpty()) {
			return List.of();
		}
		List<UUID> ids = postEntities.stream().map(Post::getId).toList();
		Map<UUID, List<PostMedia>> mediaByPost = media.findByPostIdInOrderByPositionAsc(ids).stream()
				.collect(Collectors.groupingBy(item -> item.getPost().getId()));
		return postEntities.stream().map(post -> PostView.from(post, mediaByPost.getOrDefault(post.getId(), List.of()))).toList();
	}

	private List<UUID> postIds(Collection<PostView> postViews) {
		return postViews.stream().map(post -> UUID.fromString(post.id())).distinct().toList();
	}

	private UUID parsePostId(String id) {
		try {
			return UUID.fromString(id);
		} catch (RuntimeException exception) {
			throw new ApiException("POST_NOT_FOUND", "La publicación no existe.");
		}
	}
}
