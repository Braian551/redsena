package com.redsena.demo.posts.presentation;

import com.redsena.demo.comments.presentation.CommentView;
import com.redsena.demo.likes.application.LikeService;
import com.redsena.demo.likes.presentation.PostLikeResult;
import com.redsena.demo.posts.application.CreatePostCommand;
import com.redsena.demo.posts.application.PostService;
import com.redsena.demo.shared.exception.ApiException;
import com.redsena.demo.users.presentation.UserView;
import java.util.List;
import java.util.Map;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.BatchMapping;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Controller
public class PostGraphQlController {

	private final PostService posts;
	private final LikeService likes;

	public PostGraphQlController(PostService posts, LikeService likes) {
		this.posts = posts;
		this.likes = likes;
	}

	@QueryMapping
	public PostView post(@Argument String id) {
		return posts.findPost(id);
	}

	@QueryMapping
	public com.redsena.demo.feed.presentation.PostConnection feed(@Argument Integer first, @Argument String after) {
		return posts.feed(first, after);
	}

	@MutationMapping
	public PostView createPost(@Argument CreatePostInput input) {
		if (input == null) {
			throw new ApiException("POST_INPUT_REQUIRED", "La información de la publicación es obligatoria.");
		}
		return posts.create(new CreatePostCommand(input.content(), input.mediaIds()), idempotencyKey());
	}

	@MutationMapping
	public boolean deletePost(@Argument String id) {
		return posts.delete(id);
	}

	@MutationMapping
	public PostLikeResult setPostLike(@Argument String postId, @Argument boolean liked) {
		return likes.setLike(postId, liked);
	}

	@BatchMapping(typeName = "Post", field = "author")
	public Map<PostView, UserView> author(List<PostView> postViews) {
		return posts.authors(postViews);
	}

	@BatchMapping(typeName = "Post", field = "likeCount")
	public Map<PostView, Long> likeCount(List<PostView> postViews) {
		return posts.likeCounts(postViews);
	}

	@BatchMapping(typeName = "Post", field = "commentCount")
	public Map<PostView, Long> commentCount(List<PostView> postViews) {
		return posts.commentCounts(postViews);
	}

	@BatchMapping(typeName = "Post", field = "likedByViewer")
	public Map<PostView, Boolean> likedByViewer(List<PostView> postViews) {
		return posts.likedByViewer(postViews);
	}

	@BatchMapping(typeName = "Post", field = "comments")
	public Map<PostView, List<CommentView>> comments(List<PostView> postViews) {
		return posts.comments(postViews);
	}

	private String idempotencyKey() {
		if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes) {
			return attributes.getRequest().getHeader("Idempotency-Key");
		}
		return null;
	}
}
