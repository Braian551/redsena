package com.redsena.demo.posts.application;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.redsena.demo.posts.domain.Post;
import com.redsena.demo.shared.exception.ApiException;
import com.redsena.demo.users.domain.UserAccount;
import java.util.List;
import org.junit.jupiter.api.Test;

class PostActionAuthorizerTest {

	private final PostActionAuthorizer authorizer = new PostActionAuthorizer(List.of(
			new OwnerPostActionStrategy(), new NonOwnerReportStrategy()));

	@Test
	void ownerCanUpdateAndDelete() {
		UserAccount owner = user("owner");
		Post post = new Post(owner, "Contenido");

		assertThatCode(() -> authorizer.authorize(PostAction.UPDATE, post, owner)).doesNotThrowAnyException();
		assertThatCode(() -> authorizer.authorize(PostAction.DELETE, post, owner)).doesNotThrowAnyException();
	}

	@Test
	void nonOwnerCannotUpdateOrDelete() {
		Post post = new Post(user("owner"), "Contenido");
		UserAccount other = user("other");

		assertThatThrownBy(() -> authorizer.authorize(PostAction.UPDATE, post, other))
				.isInstanceOfSatisfying(ApiException.class, error -> org.assertj.core.api.Assertions.assertThat(error.code()).isEqualTo("FORBIDDEN"));
		assertThatThrownBy(() -> authorizer.authorize(PostAction.DELETE, post, other))
				.isInstanceOfSatisfying(ApiException.class, error -> org.assertj.core.api.Assertions.assertThat(error.code()).isEqualTo("FORBIDDEN"));
	}

	@Test
	void onlyNonOwnerCanReport() {
		UserAccount owner = user("owner");
		Post post = new Post(owner, "Contenido");

		assertThatCode(() -> authorizer.authorize(PostAction.REPORT, post, user("other"))).doesNotThrowAnyException();
		assertThatThrownBy(() -> authorizer.authorize(PostAction.REPORT, post, owner))
				.isInstanceOfSatisfying(ApiException.class, error -> org.assertj.core.api.Assertions.assertThat(error.code()).isEqualTo("POST_REPORT_OWN_POST"));
	}

	private UserAccount user(String subject) {
		return new UserAccount(subject, subject + "@example.test", subject, null);
	}
}
