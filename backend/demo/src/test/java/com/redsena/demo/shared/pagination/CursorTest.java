package com.redsena.demo.shared.pagination;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.redsena.demo.shared.exception.ApiException;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class CursorTest {

	@Test
	void encodesAndDecodesTheKeysetPosition() {
		Instant createdAt = Instant.parse("2026-09-10T12:00:00Z");
		UUID id = UUID.randomUUID();

		Cursor cursor = Cursor.decode(Cursor.encode(createdAt, id));

		assertThat(cursor.createdAt()).isEqualTo(createdAt);
		assertThat(cursor.id()).isEqualTo(id);
	}

	@Test
	void rejectsMalformedCursor() {
		assertThatThrownBy(() -> Cursor.decode("not-a-cursor"))
				.isInstanceOf(ApiException.class)
				.hasMessage("El cursor de paginación no es válido.");
	}
}
