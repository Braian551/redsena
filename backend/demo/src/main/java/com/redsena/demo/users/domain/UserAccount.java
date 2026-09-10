package com.redsena.demo.users.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users", uniqueConstraints = @UniqueConstraint(name = "uk_users_firebase_subject", columnNames = "firebase_subject"))
public class UserAccount {

	@Id
	private UUID id;

	@Column(name = "firebase_subject", nullable = false, updatable = false, length = 200)
	private String firebaseSubject;

	@Column(nullable = false, length = 320)
	private String email;

	@Column(name = "display_name", nullable = false, length = 120)
	private String displayName;

	@Column(name = "photo_url", length = 2000)
	private String photoUrl;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	protected UserAccount() {
	}

	public UserAccount(String firebaseSubject, String email, String displayName, String photoUrl) {
		this.id = UUID.randomUUID();
		this.firebaseSubject = firebaseSubject;
		this.email = email;
		this.displayName = displayName;
		this.photoUrl = photoUrl;
	}

	@PrePersist
	void initializeCreatedAt() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
	}

	public void syncProfile(String email, String displayName, String photoUrl) {
		this.email = email;
		this.displayName = displayName;
		this.photoUrl = photoUrl;
	}

	public UUID getId() {
		return id;
	}

	public String getFirebaseSubject() {
		return firebaseSubject;
	}

	public String getEmail() {
		return email;
	}

	public String getDisplayName() {
		return displayName;
	}

	public String getPhotoUrl() {
		return photoUrl;
	}
}
