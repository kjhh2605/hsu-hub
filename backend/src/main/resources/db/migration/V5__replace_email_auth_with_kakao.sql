DROP TABLE password_reset_tokens;
DROP TABLE email_verification_tokens;

ALTER TABLE users DROP INDEX email_normalized;
ALTER TABLE users CHANGE COLUMN email_normalized email VARCHAR(190) NOT NULL;
ALTER TABLE users ADD COLUMN kakao_user_id BIGINT NOT NULL AFTER id;
ALTER TABLE users ADD CONSTRAINT uq_users_kakao_user_id UNIQUE (kakao_user_id);
CREATE INDEX ix_users_email ON users(email);
ALTER TABLE users DROP COLUMN password_hash, DROP COLUMN email_verified_at;
