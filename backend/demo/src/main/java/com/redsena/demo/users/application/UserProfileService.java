package com.redsena.demo.users.application;

import com.redsena.demo.security.CurrentUserService;
import com.redsena.demo.security.AdminAccessService;
import com.redsena.demo.shared.cache.CacheInvalidation;
import com.redsena.demo.shared.exception.ApiException;
import com.redsena.demo.users.domain.UserAccount;
import com.redsena.demo.users.presentation.UserView;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserProfileService {

	private static final int MAX_DISPLAY_NAME_LENGTH = 120;
	private static final int MAX_BIO_LENGTH = 180;

	private final CurrentUserService currentUser;
	private final AdminAccessService adminAccess;
	private final CacheInvalidation cacheInvalidation;

	public UserProfileService(CurrentUserService currentUser, AdminAccessService adminAccess, CacheInvalidation cacheInvalidation) {
		this.currentUser = currentUser;
		this.adminAccess = adminAccess;
		this.cacheInvalidation = cacheInvalidation;
	}

	@Transactional
	public UserView updateBio(String bio) {
		return updateProfile(null, bio);
	}

	@Transactional
	public UserView updateProfile(String displayName, String bio) {
		if (displayName == null && bio == null) {
			throw new ApiException("PROFILE_INPUT_REQUIRED", "Debes indicar al menos un dato del perfil.");
		}

		String cleanDisplayName = null;
		if (displayName != null) {
			cleanDisplayName = displayName.trim();
			if (cleanDisplayName.isBlank()) {
				throw new ApiException("PROFILE_DISPLAY_NAME_REQUIRED", "El nombre visible es obligatorio.");
			}
			if (cleanDisplayName.length() > MAX_DISPLAY_NAME_LENGTH) {
				throw new ApiException("PROFILE_DISPLAY_NAME_TOO_LONG", "El nombre visible debe tener máximo 120 caracteres.");
			}
		}

		String cleanBio = null;
		if (bio != null) {
			cleanBio = bio.trim();
			if (cleanBio.length() > MAX_BIO_LENGTH) {
				throw new ApiException("PROFILE_BIO_TOO_LONG", "La bio debe tener máximo 180 caracteres.");
			}
		}

		UserAccount user = currentUser.requireUser();
		if (cleanDisplayName != null) {
			user.updateDisplayName(cleanDisplayName);
		}
		if (cleanBio != null) {
			user.updateBio(cleanBio);
		}
		cacheInvalidation.afterCommit(cacheInvalidation::evictUserViews);
		return UserView.from(user, adminAccess.role(currentUser.authentication()));
	}
}
