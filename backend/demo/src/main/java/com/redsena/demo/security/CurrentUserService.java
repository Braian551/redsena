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
	private final AdminAccessService adminAccess;

	public CurrentUserService(UserAccountRepository users, AdminAccessService adminAccess) {
		this.users = users;
		this.adminAccess = adminAccess;
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
		// The Firebase name is the creation-time default. Display name edits are
		// domain data and must not be overwritten by a later read of `me`.
		user.syncProfile(email, user.getDisplayName(), photoUrl);
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

	@Transactional
	public UserAccount requireAdmin() {
		Authentication current = authentication();
		if (!isAuthenticated() || !adminAccess.isAdmin(current)) {
			if (!isAuthenticated()) {
				throw new ApiException("UNAUTHENTICATED", "Debes iniciar sesión para realizar esta operación.");
			}
			throw new ApiException("FORBIDDEN", "No tienes permisos de administración.");
		}
		return requireUser();
	}

	public boolean isAuthenticated() {
		Authentication current = authentication();
		return current != null && current.isAuthenticated() && !(current instanceof AnonymousAuthenticationToken)
				&& current.getName() != null && !current.getName().isBlank();
	}

	public Authentication authentication() {
		return authenticationFromContext();
	}

	public String cacheKey() {
		Authentication current = authentication();
		if (current == null || !current.isAuthenticated() || current instanceof AnonymousAuthenticationToken || current.getName() == null || current.getName().isBlank()) {
			return "anonymous";
		}
		return current.getName();
	}

	private static Authentication authenticationFromContext() {
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
