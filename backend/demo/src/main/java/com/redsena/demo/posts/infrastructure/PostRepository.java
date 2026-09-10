package com.redsena.demo.posts.infrastructure;

import com.redsena.demo.posts.domain.Post;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostRepository extends JpaRepository<Post, UUID> {

	Optional<Post> findFirstByOrderByCreatedAtDescIdDesc();

	@Query("select p from Post p order by p.createdAt desc, p.id desc")
	List<Post> findFirstPage(Pageable pageable);

	@Query("select p from Post p where p.createdAt < :createdAt or (p.createdAt = :createdAt and p.id < :id) order by p.createdAt desc, p.id desc")
	List<Post> findPageAfter(@Param("createdAt") Instant createdAt, @Param("id") UUID id, Pageable pageable);
}
