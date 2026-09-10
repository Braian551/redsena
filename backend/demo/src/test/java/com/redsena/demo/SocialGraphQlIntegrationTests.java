package com.redsena.demo;

import static org.assertj.core.api.Assertions.assertThat;

import com.redsena.demo.media.application.MediaService;
import com.redsena.demo.media.infrastructure.PostMediaRepository;
import com.redsena.demo.media.presentation.MediaUploadResponse;
import com.redsena.demo.posts.infrastructure.PostRepository;
import com.redsena.demo.reports.infrastructure.PostReportRepository;
import com.redsena.demo.users.domain.UserAccount;
import com.redsena.demo.users.infrastructure.UserAccountRepository;
import com.redsena.demo.shared.exception.ApiException;
import java.util.Map;
import java.util.UUID;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.graphql.test.autoconfigure.tester.AutoConfigureGraphQlTester;
import org.springframework.context.annotation.Import;
import org.springframework.graphql.test.tester.GraphQlTester;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.context.request.ServletRequestAttributes;

@SpringBootTest
@AutoConfigureGraphQlTester
@Import(TestcontainersConfiguration.class)
@TestPropertySource(properties = "spring.main.web-application-type=servlet")
class SocialGraphQlIntegrationTests {

	@Autowired
	private GraphQlTester graphQlTester;

	@Autowired
	private PostRepository posts;

	@Autowired
	private UserAccountRepository users;

	@Autowired
	private PostReportRepository reports;

	@Autowired
	private PostMediaRepository postMedia;

	@Autowired
	private MediaService mediaService;

	private String subject;

	@BeforeEach
	void authenticate() {
		subject = "graphql-test-" + UUID.randomUUID();
		SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken(subject, null, "ROLE_USER"));
	}

	@AfterEach
	void clearContexts() {
		SecurityContextHolder.clearContext();
		RequestContextHolder.resetRequestAttributes();
	}

	@Test
	void createsAnIdempotentPostAndReadsItThroughGraphql() {
		long before = posts.count();
		String mutation = "mutation { createPost(input: { content: \"Una publicación de integración\" }) { id content } }";

		GraphQlTester.Response first = withIdempotencyKey("post-test-key").document(mutation).execute();
		String firstId = first.path("createPost.id").entity(String.class).get();
		GraphQlTester.Response retry = withIdempotencyKey("post-test-key").document(mutation).execute();

		assertThat(retry.path("createPost.id").entity(String.class).get()).isEqualTo(firstId);
		assertThat(posts.count()).isEqualTo(before + 1);
	}

	@Test
	void updatesTheAuthenticatedProfileBioAndPersistsIt() {
		GraphQlTester.Response response = graphQlTester.document(
				"mutation { updateProfile(input: { displayName: \"  Nombre persistente  \", bio: \"  Perfil persistente  \" }) { displayName bio } }")
				.execute();

		assertThat(response.path("updateProfile.bio").entity(String.class).get()).isEqualTo("Perfil persistente");
		assertThat(response.path("updateProfile.displayName").entity(String.class).get()).isEqualTo("Nombre persistente");
		assertThat(users.findByFirebaseSubject(subject).orElseThrow().getBio()).isEqualTo("Perfil persistente");
		assertThat(users.findByFirebaseSubject(subject).orElseThrow().getDisplayName()).isEqualTo("Nombre persistente");
		GraphQlTester.Response currentProfile = graphQlTester.document("query { me { displayName bio } }").execute();
		assertThat(currentProfile.path("me.displayName").entity(String.class).get()).isEqualTo("Nombre persistente");
		assertThat(currentProfile.path("me.bio").entity(String.class).get()).isEqualTo("Perfil persistente");
	}

	@Test
	void feedReturnsBatchableRelationsAndLikeState() {
		String mutation = "mutation { createPost(input: { content: \"Post para feed\" }) { id } }";
		String postId = withIdempotencyKey("feed-post-key").document(mutation).execute().path("createPost.id").entity(String.class).get();

		graphQlTester.document("mutation { setPostLike(postId: \"" + postId + "\", liked: true) { liked likeCount } }").execute()
				.path("setPostLike.liked").entity(Boolean.class).isEqualTo(true);
		graphQlTester.document("mutation { setPostLike(postId: \"" + postId + "\", liked: true) { liked likeCount } }").execute()
				.path("setPostLike.likeCount").entity(Integer.class).isEqualTo(1);

		Map<String, Object> node = graphQlTester.document("query { feed(first: 20) { nodes { id author { id displayName } likeCount commentCount likedByViewer comments { id author { id displayName } } } pageInfo { hasNextPage endCursor } } }")
				.execute().path("feed.nodes").entityList(Map.class).get().stream()
				.filter(item -> postId.equals(item.get("id"))).findFirst().orElseThrow();

		assertThat(((Number) node.get("likeCount")).longValue()).isEqualTo(1L);
		assertThat(node.get("likedByViewer")).isEqualTo(true);
	}

	@Test
	void uploadsImageAndAssociatesItWithAPost() {
		MediaUploadResponse uploaded = mediaService.upload(
				new MockMultipartFile("file", "photo.png", "image/png", new byte[] { 1, 2, 3, 4 }));

		String mutation = "mutation { createPost(input: { content: \"Post con imagen\", mediaIds: [\""
				+ uploaded.id() + "\"] }) { media { id url contentType size } } }";
		GraphQlTester.Response response = withIdempotencyKey("media-post-key").document(mutation).execute();

		assertThat(response.path("createPost.media[0].id").entity(String.class).get()).isEqualTo(uploaded.id());
		assertThat(response.path("createPost.media[0].url").entity(String.class).get()).isEqualTo(uploaded.url());
		assertThat(response.path("createPost.media[0].contentType").entity(String.class).get()).isEqualTo("image/png");
		assertThat(response.path("createPost.media[0].size").entity(Integer.class).get()).isEqualTo(4);
	}

	@Test
	void ownerCanUpdateAndDeletePostButAnotherUserCannot() {
		String ownerSubject = subject;
		String postId = withIdempotencyKey("edit-post-key").document(
				"mutation { createPost(input: { content: \"Contenido original\" }) { id } }")
				.execute().path("createPost.id").entity(String.class).get();

		GraphQlTester.Response updated = graphQlTester.document(
				"mutation($id: ID!, $content: String!) { updatePost(id: $id, input: { content: $content }) { id content } }")
				.variable("id", postId)
				.variable("content", " Contenido corregido ")
				.execute();
		assertThat(updated.path("updatePost.content").entity(String.class).get()).isEqualTo("Contenido corregido");

		authenticateAs("post-editor-other-" + UUID.randomUUID());
		assertGraphQlError(graphQlTester.document(
				"mutation($id: ID!) { updatePost(id: $id, input: { content: \"Cambio ajeno\" }) { id } }")
				.variable("id", postId).execute(), "FORBIDDEN");
		assertGraphQlError(graphQlTester.document(
				"mutation($id: ID!) { deletePost(id: $id) }")
				.variable("id", postId).execute(), "FORBIDDEN");

		authenticateAs(ownerSubject);
		assertThat(graphQlTester.document("mutation($id: ID!) { deletePost(id: $id) }")
				.variable("id", postId).execute().path("deletePost").entity(Boolean.class).get()).isTrue();
		assertThat(posts.findById(UUID.fromString(postId))).isEmpty();
		graphQlTester.document("query($id: ID!) { post(id: $id) { id } }")
				.variable("id", postId).execute().path("post").valueIsNull();
	}

	@Test
	void nonOwnerCanReportOnceAndOwnerCannotSelfReport() {
		String ownerSubject = subject;
		String postId = withIdempotencyKey("report-post-key").document(
				"mutation { createPost(input: { content: \"Contenido reportable\" }) { id } }")
				.execute().path("createPost.id").entity(String.class).get();
		long reportsBefore = reports.count();

		authenticateAs("reporter-" + UUID.randomUUID());
		GraphQlTester.Response report = graphQlTester.document(
				"mutation($postId: ID!) { reportPost(input: { postId: $postId, reason: SPAM }) { id reason status } }")
				.variable("postId", postId).execute();
		assertThat(report.path("reportPost.reason").entity(String.class).get()).isEqualTo("SPAM");
		assertThat(report.path("reportPost.status").entity(String.class).get()).isEqualTo("OPEN");
		assertThat(reports.count()).isEqualTo(reportsBefore + 1);

		assertGraphQlError(graphQlTester.document(
				"mutation($postId: ID!) { reportPost(input: { postId: $postId, reason: SPAM }) { id } }")
				.variable("postId", postId).execute(), "POST_ALREADY_REPORTED");

		authenticateAs(ownerSubject);
		assertGraphQlError(graphQlTester.document(
				"mutation($postId: ID!) { reportPost(input: { postId: $postId, reason: SPAM }) { id } }")
				.variable("postId", postId).execute(), "POST_REPORT_OWN_POST");
	}

	@Test
	void feedVersionChangesWhenANewPostIsCreated() {
		String firstVersion = graphQlTester.document("query { feedVersion }").execute()
				.path("feedVersion").entity(String.class).get();
		withIdempotencyKey("live-feed-post-key").document(
				"mutation { createPost(input: { content: \"Nueva publicación para el feed en vivo\" }) { id } }")
				.execute();

		String nextVersion = graphQlTester.document("query { feedVersion }").execute()
				.path("feedVersion").entity(String.class).get();
		assertThat(nextVersion).isNotEqualTo(firstVersion);
	}

	@Test
	void uploadIdempotencyReplaysAndRejectsDifferentPayloads() {
		MockMultipartFile file = new MockMultipartFile("file", "photo.png", "image/png", new byte[] { 1, 2, 3, 4 });
		MediaUploadResponse first = mediaService.upload(file, "upload-idempotency-key");
		MediaUploadResponse retry = mediaService.upload(file, "upload-idempotency-key");

		assertThat(retry.id()).isEqualTo(first.id());
		assertThat(org.assertj.core.api.Assertions.catchThrowable(() -> mediaService.upload(
				new MockMultipartFile("file", "photo.png", "image/png", new byte[] { 9, 8, 7 }),
				"upload-idempotency-key")))
				.isInstanceOfSatisfying(ApiException.class, error -> assertThat(error.code()).isEqualTo("IDEMPOTENCY_KEY_REUSED"));
	}

	@Test
	void createsAnIdempotentCommentAndUpdatesThePostCount() {
		String postId = withIdempotencyKey("comment-post-key")
				.document("mutation { createPost(input: { content: \"Post comentable\" }) { id } }")
				.execute().path("createPost.id").entity(String.class).get();
		String mutation = "mutation { addComment(input: { postId: \"" + postId
				+ "\", content: \"Comentario de integración\" }) { id content } }";

		String firstId = withIdempotencyKey("comment-key").document(mutation).execute()
				.path("addComment.id").entity(String.class).get();
		String retryId = withIdempotencyKey("comment-key").document(mutation).execute()
				.path("addComment.id").entity(String.class).get();

		assertThat(retryId).isEqualTo(firstId);
		Map<String, Object> node = graphQlTester.document("query { post(id: \"" + postId
				+ "\") { commentCount comments { id content author { id } } } }")
				.execute().path("post").entity(Map.class).get();
		assertThat(((Number) node.get("commentCount")).longValue()).isEqualTo(1L);
		assertThat(((java.util.List<?>) node.get("comments"))).hasSize(1);
	}

	@Test
	void adminCanPageAndDeleteAnyPostTogetherWithItsMedia() {
		MediaUploadResponse uploaded = mediaService.upload(
				new MockMultipartFile("file", "admin-delete.png", "image/png", new byte[] { 5, 6, 7 }));
		Path storedFile = Path.of("uploads").resolve(uploaded.url().substring("/media/".length()));
		String postId = withIdempotencyKey("admin-post-key").document(
				"mutation { createPost(input: { content: \"Publicación moderable\", mediaIds: [\"" + uploaded.id() + "\"] }) { id } }")
				.execute().path("createPost.id").entity(String.class).get();
		assertThat(Files.exists(storedFile)).isTrue();

		authenticateAsAdmin();
		Map<String, Object> adminPost = graphQlTester.document(
				"query($first: Int!) { adminPosts(first: $first) { nodes { id content media { id } likeCount commentCount author { role } } pageInfo { hasNextPage endCursor } } }")
				.variable("first", 1).execute().path("adminPosts.nodes").entityList(Map.class).get().stream()
				.filter(item -> postId.equals(item.get("id"))).findFirst().orElseThrow();
		assertThat(adminPost.get("content")).isEqualTo("Publicación moderable");

		assertThat(graphQlTester.document("mutation($id: ID!) { adminDeletePost(id: $id) }")
				.variable("id", postId).execute().path("adminDeletePost").entity(Boolean.class).get()).isTrue();
		assertThat(posts.findById(UUID.fromString(postId))).isEmpty();
		assertThat(postMedia.findById(UUID.fromString(uploaded.id()))).isEmpty();
		assertThat(Files.exists(storedFile)).isFalse();
	}

	@Test
	void regularUserCannotAccessAdminPostOperations() {
		assertGraphQlError(graphQlTester.document("query { adminPosts(first: 20) { nodes { id } } }").execute(), "FORBIDDEN");
		assertGraphQlError(graphQlTester.document("mutation { adminDeletePost(id: \"00000000-0000-0000-0000-000000000000\") }").execute(), "FORBIDDEN");
	}

	private GraphQlTester withIdempotencyKey(String key) {
		MockHttpServletRequest request = new MockHttpServletRequest();
		request.addHeader("Idempotency-Key", key);
		RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
		return graphQlTester;
	}

	private void authenticateAs(String nextSubject) {
		subject = nextSubject;
		SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken(subject, null, "ROLE_USER"));
	}

	private void authenticateAsAdmin() {
		subject = "admin-" + UUID.randomUUID();
		SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken(subject, null, "ROLE_ADMIN"));
	}

	private void assertGraphQlError(GraphQlTester.Response response, String code) {
		response.errors().satisfy(errors -> assertThat(errors).anySatisfy(error ->
				assertThat(error.getExtensions()).containsEntry("code", code)));
	}
}
