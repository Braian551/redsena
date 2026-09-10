package com.redsena.demo.likes.domain;

import com.redsena.demo.posts.domain.Post;
import com.redsena.demo.users.domain.UserAccount;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.UUID;

@Entity
@Table(name = "post_likes", uniqueConstraints = @UniqueConstraint(name = "uk_post_likes_user_post", columnNames = { "user_id", "post_id" }))
public class PostLike {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private UserAccount user;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "post_id", nullable = false)
	private Post post;

	protected PostLike() {
	}

	public PostLike(UserAccount user, Post post) {
		this.id = UUID.randomUUID();
		this.user = user;
		this.post = post;
	}

	public UUID getId() {
		return id;
	}
}
