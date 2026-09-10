CREATE TABLE users (
    id UUID PRIMARY KEY,
    firebase_subject VARCHAR(200) NOT NULL,
    email VARCHAR(320) NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    photo_url VARCHAR(2000),
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_users_firebase_subject UNIQUE (firebase_subject)
);

CREATE TABLE posts (
    id UUID PRIMARY KEY,
    author_id UUID NOT NULL,
    content VARCHAR(500) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_posts_author FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_posts_feed ON posts (created_at DESC, id DESC);
CREATE INDEX idx_posts_author_created ON posts (author_id, created_at DESC, id DESC);

CREATE TABLE post_media (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    post_id UUID,
    storage_key VARCHAR(500) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT uk_post_media_storage_key UNIQUE (storage_key),
    CONSTRAINT fk_post_media_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_post_media_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
    CONSTRAINT ck_post_media_size CHECK (size > 0)
);

CREATE INDEX idx_post_media_post_position ON post_media (post_id, position);

CREATE TABLE comments (
    id UUID PRIMARY KEY,
    post_id UUID NOT NULL,
    author_id UUID NOT NULL,
    content VARCHAR(280) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_comments_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_author FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_comments_post_created ON comments (post_id, created_at ASC, id ASC);

CREATE TABLE post_likes (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    post_id UUID NOT NULL,
    CONSTRAINT uk_post_likes_user_post UNIQUE (user_id, post_id),
    CONSTRAINT fk_post_likes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_post_likes_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
);

CREATE INDEX idx_post_likes_post ON post_likes (post_id);
CREATE INDEX idx_post_likes_user ON post_likes (user_id);
