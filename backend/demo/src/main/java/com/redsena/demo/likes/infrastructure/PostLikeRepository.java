package com.redsena.demo.likes.infrastructure;

import com.redsena.demo.likes.domain.PostLike;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostLikeRepository extends JpaRepository<PostLike, UUID> {

	@Modifying
	@Query(value = "insert into post_likes (id, user_id, post_id) values (:id, :userId, :postId) on conflict (user_id, post_id) do nothing", nativeQuery = true)
	int insertIfAbsent(@Param("id") UUID id, @Param("userId") UUID userId, @Param("postId") UUID postId);

	@Modifying
	@Query("delete from PostLike l where l.user.id = :userId and l.post.id = :postId")
	int deleteByUserAndPost(@Param("userId") UUID userId, @Param("postId") UUID postId);

	@Query("select count(l) from PostLike l where l.post.id = :postId")
	long countByPostId(@Param("postId") UUID postId);

	@Query("select l.post.id, count(l) from PostLike l where l.post.id in :postIds group by l.post.id")
	List<Object[]> countByPostIds(@Param("postIds") Collection<UUID> postIds);

	@Query("select l.post.id from PostLike l where l.user.id = :userId and l.post.id in :postIds")
	List<UUID> findLikedPostIds(@Param("userId") UUID userId, @Param("postIds") Collection<UUID> postIds);
}
