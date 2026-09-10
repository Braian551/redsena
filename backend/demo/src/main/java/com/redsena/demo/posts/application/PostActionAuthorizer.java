package com.redsena.demo.posts.application;

import com.redsena.demo.posts.domain.Post;
import com.redsena.demo.shared.exception.ApiException;
import com.redsena.demo.users.domain.UserAccount;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * Strategy selector for post actions. Keeping action rules here prevents each
 * use case from reimplementing ownership checks and makes new actions explicit.
 */
@Component
public class PostActionAuthorizer {

	private final List<PostActionAuthorizationStrategy> strategies;

	public PostActionAuthorizer(List<PostActionAuthorizationStrategy> strategies) {
		this.strategies = strategies;
	}

	public void authorize(PostAction action, Post post, UserAccount actor) {
		strategies.stream()
				.filter(strategy -> strategy.supports(action))
				.findFirst()
				.orElseThrow(() -> new ApiException("POST_ACTION_UNSUPPORTED", "La acción sobre la publicación no está disponible."))
				.authorize(action, post, actor);
	}
}
