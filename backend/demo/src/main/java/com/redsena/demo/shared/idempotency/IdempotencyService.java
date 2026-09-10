package com.redsena.demo.shared.idempotency;

import com.redsena.demo.shared.exception.ApiException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.UUID;
import java.util.function.Function;
import java.util.function.Supplier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class IdempotencyService {

	private final StringRedisTemplate redis;
	private final Duration processingTtl;
	private final Duration completedTtl;

	public IdempotencyService(
			StringRedisTemplate redis,
			@Value("${app.idempotency.processing-ttl:PT5M}") Duration processingTtl,
			@Value("${app.idempotency.completed-ttl:PT24H}") Duration completedTtl) {
		this.redis = redis;
		this.processingTtl = processingTtl;
		this.completedTtl = completedTtl;
	}

	public <T> T execute(
			String subject,
			String operation,
			String idempotencyKey,
			String requestHash,
			Supplier<IdempotentResult<T>> action,
			Function<UUID, T> replay) {
		if (idempotencyKey == null || idempotencyKey.isBlank() || idempotencyKey.length() > 100) {
			throw new ApiException("IDEMPOTENCY_KEY_REQUIRED", "Esta operación requiere un Idempotency-Key válido.");
		}
		String redisKey = "idem:" + subject + ":" + operation + ":" + idempotencyKey;
		String processing = "PROCESSING|" + requestHash;
		try {
			String existing = redis.opsForValue().get(redisKey);
			if (existing == null && Boolean.TRUE.equals(redis.opsForValue().setIfAbsent(redisKey, processing, processingTtl))) {
				try {
					IdempotentResult<T> result = action.get();
					redis.opsForValue().set(redisKey, "COMPLETED|" + requestHash + "|" + result.resourceId(), completedTtl);
					return result.value();
				} catch (RuntimeException exception) {
					redis.delete(redisKey);
					throw exception;
				}
			}

			existing = redis.opsForValue().get(redisKey);
			if (existing == null) {
				throw new ApiException("IDEMPOTENCY_RETRY", "No se pudo reservar la operación; inténtala nuevamente.");
			}
			String[] fields = existing.split("\\|", 3);
			if (fields.length < 2 || !requestHash.equals(fields[1])) {
				throw new ApiException("IDEMPOTENCY_KEY_REUSED", "El Idempotency-Key ya fue usado con otro contenido.");
			}
			if ("PROCESSING".equals(fields[0])) {
				throw new ApiException("IDEMPOTENCY_IN_PROGRESS", "La operación sigue en procesamiento; inténtalo nuevamente.");
			}
			if ("COMPLETED".equals(fields[0]) && fields.length == 3) {
				return replay.apply(UUID.fromString(fields[2]));
			}
			throw new ApiException("IDEMPOTENCY_INVALID_STATE", "No se pudo recuperar el resultado de la operación.");
		} catch (ApiException exception) {
			throw exception;
		} catch (DataAccessException exception) {
			throw new ApiException("REDIS_UNAVAILABLE", "La operación no puede protegerse contra reintentos en este momento.");
		}
	}

	public static String hash(String value) {
		try {
			return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
		} catch (NoSuchAlgorithmException exception) {
			throw new IllegalStateException("SHA-256 no está disponible", exception);
		}
	}

	public record IdempotentResult<T>(UUID resourceId, T value) {
	}
}
