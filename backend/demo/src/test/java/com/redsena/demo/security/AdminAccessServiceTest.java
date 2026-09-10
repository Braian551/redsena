package com.redsena.demo.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import java.util.List;

class AdminAccessServiceTest {

	@Test
	void resolvesConfiguredEmailWithoutTrustingFrontendInput() {
		AdminAccessService access = new AdminAccessService("admin@redsena.test, second@redsena.test");
		TestingAuthenticationToken authentication = new TestingAuthenticationToken("ADMIN@REDSENA.TEST", null, "ROLE_USER");

		assertThat(access.isAdmin(authentication)).isTrue();
		assertThat(access.role(authentication)).isEqualTo(com.redsena.demo.users.domain.UserRole.ADMIN);
	}

	@Test
	void resolvesTheFirebaseEmailClaimWhenTheSubjectIsAnOpaqueUid() {
		AdminAccessService access = new AdminAccessService("admin@redsena.test");
		Jwt jwt = Jwt.withTokenValue("test-token")
				.header("alg", "none")
				.subject("firebase-uid")
				.claim("email", "ADMIN@REDSENA.TEST")
				.build();

		assertThat(access.isAdmin(new JwtAuthenticationToken(jwt, List.of(new SimpleGrantedAuthority("ROLE_USER"))))).isTrue();
	}

	@Test
	void acceptsExplicitAdminAuthorityAndRejectsRegularUsers() {
		AdminAccessService access = new AdminAccessService("");

		assertThat(access.isAdmin(new TestingAuthenticationToken("admin-subject", null, "ROLE_ADMIN"))).isTrue();
		assertThat(access.isAdmin(new TestingAuthenticationToken("user-subject", null, "ROLE_USER"))).isFalse();
	}
}
