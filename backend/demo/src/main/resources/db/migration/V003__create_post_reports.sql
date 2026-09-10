CREATE TABLE post_reports (
    id UUID PRIMARY KEY,
    post_id UUID NOT NULL,
    reporter_id UUID NOT NULL,
    reason VARCHAR(40) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_post_reports_post_reporter UNIQUE (post_id, reporter_id),
    CONSTRAINT fk_post_reports_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
    CONSTRAINT fk_post_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_post_reports_status_created ON post_reports (status, created_at ASC);
