package com.redsena.demo.users.presentation;

import com.redsena.demo.security.CurrentUserService;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

@Controller
public class UserGraphQlController {

	private final CurrentUserService currentUser;

	public UserGraphQlController(CurrentUserService currentUser) {
		this.currentUser = currentUser;
	}

	@QueryMapping
	public UserView me() {
		return currentUser.findUser().map(UserView::from).orElse(null);
	}
}
