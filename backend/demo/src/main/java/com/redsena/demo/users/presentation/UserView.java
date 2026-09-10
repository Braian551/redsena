package com.redsena.demo.users.presentation;

import com.redsena.demo.users.domain.UserAccount;
import com.redsena.demo.users.domain.UserRole;
import java.io.Serializable;

public record UserView(String id, String displayName, String email, String photoURL, String bio, UserRole role) implements Serializable {

	public static UserView from(UserAccount user) {
		return from(user, UserRole.USER);
	}

	public static UserView from(UserAccount user, UserRole role) {
		return new UserView(user.getId().toString(), user.getDisplayName(), user.getEmail(), user.getPhotoUrl(), user.getBio(), role);
	}
}
