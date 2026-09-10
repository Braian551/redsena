package com.redsena.demo.posts.application;

import com.redsena.demo.posts.domain.Post;
import com.redsena.demo.users.domain.UserAccount;

public interface PostActionAuthorizationStrategy {

	boolean supports(PostAction action);

	void authorize(PostAction action, Post post, UserAccount actor);
}
