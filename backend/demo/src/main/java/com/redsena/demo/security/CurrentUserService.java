package com.redsena.demo.security;

import com.redsena.demo.shared.exception.ApiException;
import com.redsena.demo.users.domain.UserAccount;
import com.redsena.demo.users.infrastructure.UserAccountRepository;
import java.util.Optional;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CurrentUserService {

	private final UserAccountRepository users;

	public CurrentUserService(UserAccountRepository users) {
		this.users = users;
	}

	@Transactional
	public UserAccount requireUser() {
		Authentication authentication = authentication();
		if (authentication == null || !authentication.isAuthenticated() || authentication instanceof AnonymousAuthenticationToken) {
			throw new ApiException("UNAUTHENTICATED", "Debes iniciar sesión para realizar esta operación.");
		}
		String subject = authentication.getName();
		if (subject == null || subject.isBlank()) {
			throw new ApiException("UNAUTHENTICATED", "No se pudo identificar la sesión actual.");
		}
		String email = claim(authentication, "email").orElseGet(() -> subject + "@local.redsena");
		String displayName = claim(authentication, "name").orElseGet(() -> email.split("@", 2)[0]);
		String photoUrl = claim(authentication, "picture").orElse(null);
		UserAccount user = users.findByFirebaseSubject(subject).orElseGet(() -> users.save(new UserAccount(subject, email, displayName, photoUrl)));
		user.syncProfile(email, displayName, photoUrl);
		return user;
	}

	@Transactional(readOnly = true)
	public Optional<UserAccount> findUser() {
		Authentication authentication = authentication();
		if (authentication == null || !authentication.isAuthenticated() || authentication instanceof AnonymousAuthenticationToken) {
			return Optional.empty();
		}
		return users.findByFirebaseSubject(authentication.getName());
	}

	public String requireSubject() {
		Authentication authentication = authentication();
		if (authentication == null || !authentication.isAuthenticated() || authentication instanceof AnonymousAuthenticationToken) {
			throw new ApiException("UNAUTHENTICATED", "Debes iniciar sesión para realizar esta operación.");
		}
		return authentication.getName();
	}

	public String cacheKey() {
		Authentication current = authentication();
		if (current == null || !current.isAuthenticated() || current instanceof AnonymousAuthenticationToken || current.getName() == null || current.getName().isBlank()) {
			return "anonymous";
		}
		return current.getName();
	}

	private static Authentication authentication() {
		return SecurityContextHolder.getContext().getAuthentication();
	}

	private static Optional<String> claim(Authentication authentication, String name) {
		if (authentication.getPrincipal() instanceof Jwt jwt) {
			Object value = jwt.getClaims().get(name);
			return value == null ? Optional.empty() : Optional.of(value.toString());
		}
		return Optional.empty();
	}
}
