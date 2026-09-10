package com.redsena.demo.shared.cache;

import java.time.Duration;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;

@Configuration(proxyBeanMethods = false)
@EnableCaching
public class CacheConfig implements CachingConfigurer {

	private static final Logger LOGGER = LoggerFactory.getLogger(CacheConfig.class);

	@Bean
	CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
		RedisCacheConfiguration defaults = RedisCacheConfiguration.defaultCacheConfig()
				.disableCachingNullValues();
		return RedisCacheManager.builder(connectionFactory)
				.cacheDefaults(defaults.entryTtl(Duration.ofMinutes(2)))
				.withInitialCacheConfigurations(Map.of(
						"posts", defaults.entryTtl(Duration.ofMinutes(2)),
						"feed", defaults.entryTtl(Duration.ofSeconds(30))))
				.build();
	}

	@Bean
	@Override
	public CacheErrorHandler errorHandler() {
		return new CacheErrorHandler() {
			@Override
			public void handleCacheGetError(RuntimeException exception, Cache cache, Object key) {
				logCacheFailure("get", cache, key, exception);
			}

			@Override
			public void handleCachePutError(RuntimeException exception, Cache cache, Object key, Object value) {
				logCacheFailure("put", cache, key, exception);
			}

			@Override
			public void handleCacheEvictError(RuntimeException exception, Cache cache, Object key) {
				logCacheFailure("evict", cache, key, exception);
			}

			@Override
			public void handleCacheClearError(RuntimeException exception, Cache cache) {
				logCacheFailure("clear", cache, "*", exception);
			}
		};
	}

	private static void logCacheFailure(String operation, Cache cache, Object key, RuntimeException exception) {
		LOGGER.warn("cache_{}_failed cache={} key={} reason={}", operation, cache.getName(), key, exception.getClass().getSimpleName());
	}
}
