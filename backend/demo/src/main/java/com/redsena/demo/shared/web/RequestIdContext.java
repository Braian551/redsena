package com.redsena.demo.shared.web;

public final class RequestIdContext {

	private static final ThreadLocal<String> CURRENT = new ThreadLocal<>();

	private RequestIdContext() {
	}

	public static void set(String requestId) {
		CURRENT.set(requestId);
	}

	public static String current() {
		String requestId = CURRENT.get();
		return requestId == null ? "unknown" : requestId;
	}

	public static void clear() {
		CURRENT.remove();
	}
}
