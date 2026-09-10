package com.redsena.demo.posts.application;

import com.redsena.demo.media.domain.PostMedia;
import com.redsena.demo.media.infrastructure.MediaStorage;
import com.redsena.demo.media.infrastructure.PostMediaRepository;
import com.redsena.demo.posts.domain.Post;
import com.redsena.demo.posts.infrastructure.PostRepository;
import com.redsena.demo.security.CurrentUserService;
import com.redsena.demo.shared.cache.CacheInvalidation;
import com.redsena.demo.shared.exception.ApiException;
import com.redsena.demo.users.domain.UserAccount;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Coordinates domain deletion and post-commit cleanup of files in the media volume. */
@Service
public class PostDeletionService {

	private static final Logger log = LoggerFactory.getLogger(PostDeletionService.class);

	private final PostRepository posts;
	private final PostMediaRepository media;
	private final MediaStorage storage;
	private final CacheInvalidation cacheInvalidation;
	private final PostActionAuthorizer authorizer;

	public PostDeletionService(
			PostRepository posts,
			PostMediaRepository media,
			MediaStorage storage,
			CacheInvalidation cacheInvalidation,
			PostActionAuthorizer authorizer) {
		this.posts = posts;
		this.media = media;
		this.storage = storage;
		this.cacheInvalidation = cacheInvalidation;
		this.authorizer = authorizer;
	}

	@Transactional
	public boolean deleteOwned(String postId, UserAccount actor) {
		Post post = findPost(postId);
		authorizer.authorize(PostAction.DELETE, post, actor);
		return deleteEntity(post);
	}

	@Transactional
	public boolean deleteAsAdmin(String postId, UserAccount actor) {
		if (actor == null) {
			throw new ApiException("UNAUTHENTICATED", "Debes iniciar sesión para realizar esta operación.");
		}
		return deleteEntity(findPost(postId));
	}

	private boolean deleteEntity(Post post) {
		String postId = post.getId().toString();
		List<PostMedia> attachments = media.findByPostIdOrderByPositionAsc(post.getId());
		List<String> storageKeys = attachments.stream().map(PostMedia::getStorageKey).toList();
		if (!attachments.isEmpty()) {
			media.deleteAll(attachments);
		}
		posts.delete(post);
		cacheInvalidation.afterCommit(() -> {
			cacheInvalidation.evictPost(postId);
			storageKeys.forEach(this::deleteStoredFile);
		});
		return true;
	}

	private Post findPost(String postId) {
		UUID id;
		try {
			id = UUID.fromString(postId);
		} catch (RuntimeException exception) {
			throw new ApiException("POST_NOT_FOUND", "La publicación no existe.");
		}
		return posts.findById(id).orElseThrow(() -> new ApiException("POST_NOT_FOUND", "La publicación no existe."));
	}

	private void deleteStoredFile(String storageKey) {
		try {
			storage.delete(storageKey);
		} catch (IOException exception) {
			log.warn("No se pudo limpiar un archivo de media después de eliminar una publicación.");
		}
	}
}
