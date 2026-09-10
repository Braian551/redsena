package com.redsena.demo.admin.presentation;

import com.redsena.demo.admin.application.AdminPostService;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

@Controller
public class AdminGraphQlController {

	private final AdminPostService posts;

	public AdminGraphQlController(AdminPostService posts) {
		this.posts = posts;
	}

	@QueryMapping
	public AdminPostConnection adminPosts(@Argument Integer first, @Argument String after) {
		return posts.page(first, after);
	}

	@MutationMapping
	public boolean adminDeletePost(@Argument String id) {
		return posts.delete(id);
	}
}
