package com.redsena.demo.posts.application;

import com.redsena.demo.posts.domain.Post;
import com.redsena.demo.shared.exception.ApiException;
import com.redsena.demo.users.domain.UserAccount;
import org.springframework.stereotype.Component;

@Component
public class NonOwnerReportStrategy implements PostActionAuthorizationStrategy {

	@Override
	public boolean supports(PostAction action) {
		return action == PostAction.REPORT;
	}

	@Override
	public void authorize(PostAction action, Post post, UserAccount actor) {
		if (post.getAuthor().getId().equals(actor.getId())) {
			throw new ApiException("POST_REPORT_OWN_POST", "No puedes reportar tu propia publicación.");
		}
	}
}
