package com.redsena.demo.security;

import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.Customizer;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.beans.factory.annotation.Value;

@Configuration(proxyBeanMethods = false)
public class SecurityConfig {

	@Bean
	@Order(2)
	SecurityFilterChain localSecurityFilterChain(HttpSecurity http) throws Exception {
		http
				.csrf(csrf -> csrf.disable())
				.cors(Customizer.withDefaults())
				.authorizeHttpRequests(authorize -> authorize
						.requestMatchers("/actuator/metrics").denyAll()
						.anyRequest().permitAll());
		return http.build();
	}

	@Configuration(proxyBeanMethods = false)
	@ConditionalOnExpression("'${app.firebase.project-id:}'.length() > 0")
	static class FirebaseResourceServerConfiguration {

		@Bean
		JwtDecoder firebaseJwtDecoder(@Value("${app.firebase.project-id}") String projectId) {
			NimbusJwtDecoder decoder = NimbusJwtDecoder
					.withJwkSetUri("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
					.build();
			decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
					JwtValidators.createDefaultWithIssuer("https://securetoken.google.com/" + projectId),
					new JwtClaimValidator<java.util.List<String>>("aud", audience -> audience != null && audience.contains(projectId))));
			return decoder;
		}

		@Bean
		@Order(1)
		SecurityFilterChain firebaseSecurityFilterChain(HttpSecurity http, JwtDecoder jwtDecoder) throws Exception {
			http
				.securityMatcher("/graphql", "/api/**", "/actuator/metrics")
				.csrf(csrf -> csrf.disable())
				.cors(Customizer.withDefaults())
					.authorizeHttpRequests(authorize -> authorize.anyRequest().authenticated())
					.oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.decoder(jwtDecoder)));
			return http.build();
		}
	}
}
