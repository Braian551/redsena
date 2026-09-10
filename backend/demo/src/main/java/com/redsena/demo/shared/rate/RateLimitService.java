package com.redsena.demo.shared.rate;

import com.redsena.demo.shared.exception.ApiException;
import java.time.Duration;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class RateLimitService {

	private final StringRedisTemplate redis;

	public RateLimitService(StringRedisTemplate redis) {
		this.redis = redis;
	}

	public void check(String operation, String subject, int limit, Duration window) {
		try {
			String key = "rate:" + operation + ":" + subject;
			Long count = redis.opsForValue().increment(key);
			if (count != null && count == 1) {
				redis.expire(key, window);
			}
			if (count != null && count > limit) {
				throw new ApiException("RATE_LIMITED", "Se alcanzó el límite temporal de esta operación.");
			}
		} catch (ApiException exception) {
			throw exception;
		} catch (DataAccessException exception) {
			throw new ApiException("REDIS_UNAVAILABLE", "No se pudo validar el límite de solicitudes.");
		}
	}
}
