ALTER TABLE email_verification_tokens MODIFY token_hash VARCHAR(64) NOT NULL;
ALTER TABLE password_reset_tokens MODIFY token_hash VARCHAR(64) NOT NULL;
ALTER TABLE user_sessions MODIFY session_hash VARCHAR(64) NOT NULL;
ALTER TABLE file_assets MODIFY sha256 VARCHAR(64) NOT NULL;
ALTER TABLE application_idempotency MODIFY payload_hash VARCHAR(64) NOT NULL;
