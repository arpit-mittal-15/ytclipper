-- +goose Up
-- +goose StatementBegin
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS timestamps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id VARCHAR(255) NOT NULL,
    timestamp DOUBLE PRECISION NOT NULL,
    title VARCHAR(255),
    note TEXT,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_timestamps_user_id ON timestamps(user_id);
CREATE INDEX IF NOT EXISTS idx_timestamps_video_id ON timestamps(video_id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS idx_timestamps_user_id;
DROP INDEX IF EXISTS idx_timestamps_video_id;

DROP TABLE IF EXISTS timestamps;
-- +goose StatementEnd
