package com.redsena.demo.users.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.redsena.demo.security.CurrentUserService;
import com.redsena.demo.security.AdminAccessService;
import com.redsena.demo.shared.cache.CacheInvalidation;
import com.redsena.demo.shared.exception.ApiException;
import com.redsena.demo.users.domain.UserAccount;
import com.redsena.demo.users.presentation.UserView;
import org.junit.jupiter.api.Test;

class UserProfileServiceTest {

	private final CurrentUserService currentUser = mock(CurrentUserService.class);
	private final AdminAccessService adminAccess = mock(AdminAccessService.class);
	private final CacheInvalidation cacheInvalidation = mock(CacheInvalidation.class);
	private final UserProfileService service = new UserProfileService(currentUser, adminAccess, cacheInvalidation);

	@Test
	void trimsAndUpdatesOnlyTheAuthenticatedAccount() {
		UserAccount account = new UserAccount("subject", "user@example.com", "User", null);
		when(currentUser.requireUser()).thenReturn(account);

		UserView result = service.updateProfile("  Nombre visible  ", "  Una bio válida  ");

		assertThat(result.bio()).isEqualTo("Una bio válida");
		assertThat(result.displayName()).isEqualTo("Nombre visible");
		assertThat(account.getBio()).isEqualTo("Una bio válida");
		assertThat(account.getDisplayName()).isEqualTo("Nombre visible");
		verify(currentUser).requireUser();
		verify(cacheInvalidation).afterCommit(org.mockito.ArgumentMatchers.any(Runnable.class));
	}

	@Test
	void rejectsBioLongerThanTheContractBeforeTouchingTheUser() {
		assertThatThrownBy(() -> service.updateBio("x".repeat(181)))
				.isInstanceOfSatisfying(ApiException.class,
						error -> assertThat(error.code()).isEqualTo("PROFILE_BIO_TOO_LONG"));

		verifyNoInteractions(currentUser);
	}

	@Test
	void rejectsDisplayNameLongerThanTheContractBeforeTouchingTheUser() {
		assertThatThrownBy(() -> service.updateProfile("x".repeat(121), null))
				.isInstanceOfSatisfying(ApiException.class,
						error -> assertThat(error.code()).isEqualTo("PROFILE_DISPLAY_NAME_TOO_LONG"));

		verifyNoInteractions(currentUser);
	}
}
