package com.redsena.demo.users.presentation;

import com.redsena.demo.users.domain.UserAccount;
import java.io.Serializable;

public record UserView(String id, String displayName, String email, String photoURL) implements Serializable {

	public static UserView from(UserAccount user) {
		return new UserView(user.getId().toString(), user.getDisplayName(), user.getEmail(), user.getPhotoUrl());
	}
}
