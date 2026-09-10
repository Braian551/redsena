package com.redsena.demo.comments.infrastructure;

import com.redsena.demo.comments.domain.Comment;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommentRepository extends JpaRepository<Comment, UUID> {

	@Query(value = """
			select ranked.id, ranked.post_id, ranked.author_id, ranked.content, ranked.created_at
			from (
				select c.id, c.post_id, c.author_id, c.content, c.created_at,
				       row_number() over (partition by c.post_id order by c.created_at asc, c.id asc) as row_number
				from comments c
				where c.post_id in (:postIds)
			) ranked
			where ranked.row_number <= :limit
			order by ranked.created_at asc, ranked.id asc
			""", nativeQuery = true)
	List<Comment> findFirstPageForPosts(@Param("postIds") Collection<UUID> postIds, @Param("limit") int limit);

	long countByPostId(UUID postId);

	@Query("select c.post.id, count(c) from Comment c where c.post.id in :postIds group by c.post.id")
	List<Object[]> countByPostIds(@Param("postIds") Collection<UUID> postIds);
}
