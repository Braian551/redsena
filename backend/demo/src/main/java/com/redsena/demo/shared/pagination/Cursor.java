package com.redsena.demo.shared.pagination;

import com.redsena.demo.shared.exception.ApiException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

public record Cursor(Instant createdAt, UUID id) {

	public static String encode(Instant createdAt, UUID id) {
		String raw = createdAt.toString() + "|" + id;
		return Base64.getUrlEncoder().withoutPadding().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
	}

	public static Cursor decode(String value) {
		try {
			String raw = new String(Base64.getUrlDecoder().decode(value), StandardCharsets.UTF_8);
			int separator = raw.lastIndexOf('|');
			if (separator <= 0 || separator == raw.length() - 1) {
				throw new IllegalArgumentException("invalid cursor");
			}
			return new Cursor(Instant.parse(raw.substring(0, separator)), UUID.fromString(raw.substring(separator + 1)));
		} catch (RuntimeException exception) {
			throw new ApiException("INVALID_CURSOR", "El cursor de paginación no es válido.");
		}
	}
}
