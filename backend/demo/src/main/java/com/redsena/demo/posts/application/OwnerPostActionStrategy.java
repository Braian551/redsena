package com.redsena.demo.posts.application;

import com.redsena.demo.posts.domain.Post;
import com.redsena.demo.shared.exception.ApiException;
import com.redsena.demo.users.domain.UserAccount;
import org.springframework.stereotype.Component;

@Component
public class OwnerPostActionStrategy implements PostActionAuthorizationStrategy {

	@Override
	public boolean supports(PostAction action) {
		return action == PostAction.UPDATE || action == PostAction.DELETE;
	}

	@Override
	public void authorize(PostAction action, Post post, UserAccount actor) {
		if (!post.getAuthor().getId().equals(actor.getId())) {
			throw new ApiException("FORBIDDEN", "No tienes permiso para modificar esta publicación.");
		}
	}
}
