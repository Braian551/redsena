package com.redsena.demo.users.presentation;

import com.redsena.demo.security.CurrentUserService;
import com.redsena.demo.security.AdminAccessService;
import com.redsena.demo.users.application.UserProfileService;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

@Controller
public class UserGraphQlController {

	private final CurrentUserService currentUser;
	private final UserProfileService profile;
	private final AdminAccessService adminAccess;

	public UserGraphQlController(CurrentUserService currentUser, UserProfileService profile, AdminAccessService adminAccess) {
		this.currentUser = currentUser;
		this.profile = profile;
		this.adminAccess = adminAccess;
	}

	@QueryMapping
	public UserView me() {
		if (!currentUser.isAuthenticated()) {
			return null;
		}
		return UserView.from(currentUser.requireUser(), adminAccess.role(currentUser.authentication()));
	}

	@MutationMapping
	public UserView updateProfile(@Argument("input") UpdateProfileInput input) {
		return profile.updateProfile(input.displayName(), input.bio());
	}
}
