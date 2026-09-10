package com.redsena.demo.posts.application;

import com.redsena.demo.media.domain.PostMedia;
import com.redsena.demo.media.infrastructure.PostMediaRepository;
import com.redsena.demo.posts.domain.Post;
import com.redsena.demo.posts.infrastructure.PostRepository;
import com.redsena.demo.posts.presentation.PostView;
import com.redsena.demo.security.CurrentUserService;
import com.redsena.demo.shared.cache.CacheInvalidation;
import com.redsena.demo.shared.exception.ApiException;
import com.redsena.demo.shared.rate.RateLimitService;
import java.time.Duration;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PostWriteService {

	private final PostRepository posts;
	private final PostMediaRepository media;
	private final CurrentUserService currentUser;
	private final RateLimitService rateLimit;
	private final CacheInvalidation cacheInvalidation;
	private final int postCreateLimit;

	public PostWriteService(
			PostRepository posts,
			PostMediaRepository media,
			CurrentUserService currentUser,
			RateLimitService rateLimit,
			CacheInvalidation cacheInvalidation,
			@Value("${app.rate-limit.post-create:10}") int postCreateLimit) {
		this.posts = posts;
		this.media = media;
		this.currentUser = currentUser;
		this.rateLimit = rateLimit;
		this.cacheInvalidation = cacheInvalidation;
		this.postCreateLimit = postCreateLimit;
	}

	@Transactional
	public PostView create(CreatePostCommand command) {
		validate(command);
		String subject = currentUser.requireSubject();
		rateLimit.check("post-create", subject, postCreateLimit, Duration.ofMinutes(1));
		var author = currentUser.requireUser();
		Post post = posts.save(new Post(author, command.content().trim()));

		List<String> ids = command.mediaIds() == null ? List.of() : command.mediaIds();
		if (!ids.isEmpty()) {
			List<UUID> mediaIds = ids.stream().map(this::parseMediaId).toList();
			Map<UUID, PostMedia> attachmentsById = media.findAllById(mediaIds).stream().collect(Collectors.toMap(PostMedia::getId, item -> item));
			List<PostMedia> attachments = mediaIds.stream().map(attachmentsById::get).filter(java.util.Objects::nonNull).toList();
			if (attachments.size() != mediaIds.size() || attachments.stream().anyMatch(item -> !item.getOwner().getId().equals(author.getId()) || item.getPost() != null)) {
				throw new ApiException("MEDIA_NOT_AVAILABLE", "Una o más imágenes no pertenecen a tu sesión o ya están asociadas.");
			}
			for (int index = 0; index < attachments.size(); index++) {
				attachments.get(index).attachTo(post, index);
			}
			media.saveAll(attachments);
		}
		cacheInvalidation.afterCommit(cacheInvalidation::evictFeed);
		return PostView.from(post, media.findByPostIdOrderByPositionAsc(post.getId()));
	}

	@Transactional
	public boolean delete(String postId) {
		UUID id = parsePostId(postId);
		Post post = posts.findById(id).orElseThrow(() -> new ApiException("POST_NOT_FOUND", "La publicación no existe."));
		if (!post.getAuthor().getId().equals(currentUser.requireUser().getId())) {
			throw new ApiException("FORBIDDEN", "No tienes permiso para eliminar esta publicación.");
		}
		posts.delete(post);
		cacheInvalidation.afterCommit(() -> cacheInvalidation.evictPost(postId));
		return true;
	}

	private void validate(CreatePostCommand command) {
		if (command == null || command.content() == null || command.content().isBlank()) {
			throw new ApiException("POST_CONTENT_REQUIRED", "Escribe algo antes de publicar.");
		}
		if (command.content().trim().length() > 500) {
			throw new ApiException("POST_CONTENT_TOO_LONG", "La publicación no puede superar 500 caracteres.");
		}
		List<String> ids = command.mediaIds() == null ? List.of() : command.mediaIds();
		if (ids.size() > 4 || ids.stream().anyMatch(id -> id == null || id.isBlank()) || ids.size() != new HashSet<>(ids).size()) {
			throw new ApiException("MEDIA_INPUT_INVALID", "Puedes adjuntar hasta cuatro imágenes sin repetirlas.");
		}
	}

	private UUID parseMediaId(String id) {
		try {
			return UUID.fromString(id);
		} catch (RuntimeException exception) {
			throw new ApiException("MEDIA_INPUT_INVALID", "El identificador de imagen no es válido.");
		}
	}

	private UUID parsePostId(String id) {
		try {
			return UUID.fromString(id);
		} catch (RuntimeException exception) {
			throw new ApiException("POST_NOT_FOUND", "La publicación no existe.");
		}
	}
}
