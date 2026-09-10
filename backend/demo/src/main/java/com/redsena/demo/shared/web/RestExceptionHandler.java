package com.redsena.demo.shared.web;

import com.redsena.demo.shared.exception.ApiException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class RestExceptionHandler {

	@ExceptionHandler(ApiException.class)
	ResponseEntity<Map<String, String>> handleApiException(ApiException exception) {
		HttpStatus status = switch (exception.code()) {
			case "UNAUTHENTICATED" -> HttpStatus.UNAUTHORIZED;
			case "FORBIDDEN" -> HttpStatus.FORBIDDEN;
			default -> HttpStatus.BAD_REQUEST;
		};
		return ResponseEntity.status(status).body(Map.of("code", exception.code(), "message", exception.getMessage(), "requestId", RequestIdContext.current()));
	}

	@ExceptionHandler(Exception.class)
	ResponseEntity<Map<String, String>> handleUnexpectedException() {
		return ResponseEntity.internalServerError().body(Map.of("code", "INTERNAL_ERROR", "message", "Ocurrió un error interno.", "requestId", RequestIdContext.current()));
	}
}
