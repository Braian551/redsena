package com.redsena.demo.shared.cache;

import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Component
public class CacheInvalidation {

	private final CacheManager cacheManager;

	public CacheInvalidation(CacheManager cacheManager) {
		this.cacheManager = cacheManager;
	}

	public void afterCommit(Runnable action) {
		if (TransactionSynchronizationManager.isSynchronizationActive()) {
			TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
				@Override
				public void afterCommit() {
					action.run();
				}
			});
			return;
		}
		action.run();
	}

	public void evictFeed() {
		cacheManager.getCache("feed").clear();
		cacheManager.getCache("feed-version").clear();
	}

	public void evictPost(String postId) {
		// PostView contiene likedByViewer; invalidar todas las variantes evita dejar
		// una vista de otro usuario después de una escritura.
		cacheManager.getCache("posts").clear();
		evictFeed();
	}

	public void evictUserViews() {
		// Los autores embebidos en posts/feed contienen displayName y photoURL.
		cacheManager.getCache("posts").clear();
		evictFeed();
	}
}
