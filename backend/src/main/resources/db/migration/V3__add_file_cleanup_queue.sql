CREATE TABLE file_cleanup_tasks (
 id BIGINT PRIMARY KEY AUTO_INCREMENT,
 file_asset_id BIGINT NOT NULL,
 object_key VARCHAR(80) NOT NULL,
 attempts INT NOT NULL DEFAULT 0,
 created_at TIMESTAMP(6) NOT NULL,
 last_attempt_at TIMESTAMP(6) NULL,
 INDEX ix_file_cleanup_created(created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
