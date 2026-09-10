package com.redsena.demo.shared.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class RequestIdFilter extends OncePerRequestFilter {

	private static final Pattern SAFE_REQUEST_ID = Pattern.compile("[A-Za-z0-9._:-]{1,100}");

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {
		String requestedId = request.getHeader("X-Request-ID");
		String requestId = requestedId != null && SAFE_REQUEST_ID.matcher(requestedId).matches()
				? requestedId
				: UUID.randomUUID().toString();
		RequestIdContext.set(requestId);
		response.setHeader("X-Request-ID", requestId);
		try {
			filterChain.doFilter(request, response);
		} finally {
			RequestIdContext.clear();
		}
	}
}
