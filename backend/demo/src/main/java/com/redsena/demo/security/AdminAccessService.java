package com.redsena.demo.security;

import com.redsena.demo.users.domain.UserRole;
import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

/** Resolves the administrative role from server-controlled authentication data. */
@Service
public class AdminAccessService {

	private final Set<String> adminEmails;

	public AdminAccessService(@Value("${app.admin.emails:}") String configuredAdminEmails) {
		this.adminEmails = Arrays.stream(configuredAdminEmails == null ? new String[0] : configuredAdminEmails.split(","))
				.map(AdminAccessService::normalize)
				.filter(email -> !email.isBlank())
				.collect(Collectors.toUnmodifiableSet());
	}

	public boolean isAdmin(Authentication authentication) {
		if (authentication == null || !authentication.isAuthenticated()) {
			return false;
		}
		if (authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority)
				.anyMatch(authority -> "ROLE_ADMIN".equals(authority) || "ADMIN".equals(authority))) {
			return true;
		}
		Jwt jwt = jwt(authentication);
		if (jwt != null) {
			Object adminClaim = jwt.getClaims().get("admin");
			if (Boolean.TRUE.equals(adminClaim)) {
				return true;
			}
			Object roleClaim = jwt.getClaims().get("role");
			if (roleClaim != null && "ADMIN".equalsIgnoreCase(roleClaim.toString())) {
				return true;
			}
		}
		return adminEmails.contains(email(authentication));
	}

	public UserRole role(Authentication authentication) {
		return isAdmin(authentication) ? UserRole.ADMIN : UserRole.USER;
	}

	public UserRole roleForEmail(String email) {
		return adminEmails.contains(normalize(email)) ? UserRole.ADMIN : UserRole.USER;
	}

	private static String email(Authentication authentication) {
		Jwt jwt = jwt(authentication);
		if (jwt != null) {
			Object value = jwt.getClaims().get("email");
			return normalize(value == null ? null : value.toString());
		}
		return normalize(authentication.getName());
	}

	private static Jwt jwt(Authentication authentication) {
		if (authentication instanceof JwtAuthenticationToken token) {
			return token.getToken();
		}
		return authentication.getPrincipal() instanceof Jwt token ? token : null;
	}

	private static String normalize(String value) {
		return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
	}
}
