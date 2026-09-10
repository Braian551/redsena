package com.redsena.demo.likes.application;

import com.redsena.demo.likes.infrastructure.PostLikeRepository;
import com.redsena.demo.likes.presentation.PostLikeResult;
import com.redsena.demo.posts.infrastructure.PostRepository;
import com.redsena.demo.security.CurrentUserService;
import com.redsena.demo.shared.cache.CacheInvalidation;
import com.redsena.demo.shared.exception.ApiException;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LikeService {

	private final PostLikeRepository likes;
	private final PostRepository posts;
	private final CurrentUserService currentUser;
	private final CacheInvalidation cacheInvalidation;

	public LikeService(PostLikeRepository likes, PostRepository posts, CurrentUserService currentUser, CacheInvalidation cacheInvalidation) {
		this.likes = likes;
		this.posts = posts;
		this.currentUser = currentUser;
		this.cacheInvalidation = cacheInvalidation;
	}

	@Transactional
	public PostLikeResult setLike(String postId, boolean liked) {
		UUID parsedPostId = parsePostId(postId);
		var post = posts.findById(parsedPostId).orElseThrow(() -> new ApiException("POST_NOT_FOUND", "La publicación no existe."));
		var user = currentUser.requireUser();
		if (liked) {
			likes.insertIfAbsent(UUID.randomUUID(), user.getId(), post.getId());
		} else {
			likes.deleteByUserAndPost(user.getId(), post.getId());
		}
		cacheInvalidation.afterCommit(() -> cacheInvalidation.evictPost(postId));
		return new PostLikeResult(liked, likes.countByPostId(post.getId()));
	}

	private UUID parsePostId(String id) {
		try {
			return UUID.fromString(id);
		} catch (RuntimeException exception) {
			throw new ApiException("POST_NOT_FOUND", "La publicación no existe.");
		}
	}
}
