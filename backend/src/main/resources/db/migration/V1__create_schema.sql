CREATE TABLE users (
 id BIGINT PRIMARY KEY AUTO_INCREMENT,
 email_normalized VARCHAR(190) NOT NULL UNIQUE,
 password_hash VARCHAR(255) NOT NULL,
 email_verified_at TIMESTAMP(6) NULL,
 service_role VARCHAR(30) NOT NULL,
 status VARCHAR(30) NOT NULL,
 created_at TIMESTAMP(6) NOT NULL,
 updated_at TIMESTAMP(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE email_verification_tokens (
 id BIGINT PRIMARY KEY AUTO_INCREMENT, user_id BIGINT NOT NULL, token_hash CHAR(64) NOT NULL UNIQUE,
 expires_at TIMESTAMP(6) NOT NULL, consumed_at TIMESTAMP(6) NULL, created_at TIMESTAMP(6) NOT NULL,
 CONSTRAINT fk_verification_user FOREIGN KEY(user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE password_reset_tokens (
 id BIGINT PRIMARY KEY AUTO_INCREMENT, user_id BIGINT NOT NULL, token_hash CHAR(64) NOT NULL UNIQUE,
 expires_at TIMESTAMP(6) NOT NULL, consumed_at TIMESTAMP(6) NULL, created_at TIMESTAMP(6) NOT NULL,
 CONSTRAINT fk_reset_user FOREIGN KEY(user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_sessions (
 session_hash CHAR(64) PRIMARY KEY, user_id BIGINT NOT NULL, created_at TIMESTAMP(6) NOT NULL,
 last_seen_at TIMESTAMP(6) NOT NULL, expires_at TIMESTAMP(6) NOT NULL, revoked_at TIMESTAMP(6) NULL,
 INDEX ix_session_user(user_id), CONSTRAINT fk_session_user FOREIGN KEY(user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE file_assets (
 id BIGINT PRIMARY KEY AUTO_INCREMENT, object_key VARCHAR(80) NOT NULL UNIQUE,
 original_filename VARCHAR(120) NOT NULL, media_type VARCHAR(100) NOT NULL, byte_size BIGINT NOT NULL,
 sha256 CHAR(64) NOT NULL, purpose VARCHAR(30) NOT NULL, created_at TIMESTAMP(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE clubs (
 id BIGINT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(100) NOT NULL, category VARCHAR(50) NOT NULL,
 short_introduction VARCHAR(240) NULL, detailed_introduction LONGTEXT NULL,
 recruitment_status VARCHAR(20) NOT NULL DEFAULT 'CLOSED', cover_file_asset_id BIGINT NULL,
 created_at TIMESTAMP(6) NOT NULL, updated_at TIMESTAMP(6) NOT NULL,
 CONSTRAINT fk_club_cover FOREIGN KEY(cover_file_asset_id) REFERENCES file_assets(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE club_introduction_images (
 id BIGINT PRIMARY KEY AUTO_INCREMENT, club_id BIGINT NOT NULL, file_asset_id BIGINT NOT NULL,
 display_order INT NOT NULL,
 UNIQUE KEY uq_club_intro_image_order(club_id,display_order),
 UNIQUE KEY uq_club_intro_image_file(club_id,file_asset_id),
 CONSTRAINT fk_intro_image_club FOREIGN KEY(club_id) REFERENCES clubs(id),
 CONSTRAINT fk_intro_image_file FOREIGN KEY(file_asset_id) REFERENCES file_assets(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE club_users (
 id BIGINT PRIMARY KEY AUTO_INCREMENT, user_id BIGINT NOT NULL, club_id BIGINT NOT NULL, club_role VARCHAR(30) NOT NULL,
 UNIQUE KEY uq_club_user(user_id,club_id), CONSTRAINT fk_club_user_user FOREIGN KEY(user_id) REFERENCES users(id),
 CONSTRAINT fk_club_user_club FOREIGN KEY(club_id) REFERENCES clubs(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE recruitments (
 id BIGINT PRIMARY KEY AUTO_INCREMENT, club_id BIGINT NOT NULL,
 opens_at TIMESTAMP(6) NOT NULL, closes_at TIMESTAMP(6) NOT NULL,
 published_at TIMESTAMP(6) NOT NULL, created_by BIGINT NOT NULL, created_at TIMESTAMP(6) NOT NULL,
 INDEX ix_recruitment_club_period(club_id,opens_at,closes_at),
 CONSTRAINT fk_recruitment_club FOREIGN KEY(club_id) REFERENCES clubs(id), CONSTRAINT fk_recruitment_user FOREIGN KEY(created_by) REFERENCES users(id),
 CONSTRAINT ck_recruitment_period CHECK(opens_at < closes_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE recruitment_stages (
 id BIGINT PRIMARY KEY AUTO_INCREMENT, recruitment_id BIGINT NOT NULL, type VARCHAR(30) NOT NULL,
 label VARCHAR(100) NOT NULL, starts_at TIMESTAMP(6) NULL, ends_at TIMESTAMP(6) NULL, enabled BOOLEAN NOT NULL,
 display_order INT NOT NULL, CONSTRAINT fk_stage_recruitment FOREIGN KEY(recruitment_id) REFERENCES recruitments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE application_forms (
 id BIGINT PRIMARY KEY AUTO_INCREMENT, recruitment_id BIGINT NOT NULL UNIQUE, created_at TIMESTAMP(6) NOT NULL,
 CONSTRAINT fk_form_recruitment FOREIGN KEY(recruitment_id) REFERENCES recruitments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE form_steps (
 id BIGINT PRIMARY KEY AUTO_INCREMENT, form_id BIGINT NOT NULL, title VARCHAR(100) NOT NULL, display_order INT NOT NULL,
 CONSTRAINT fk_step_form FOREIGN KEY(form_id) REFERENCES application_forms(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE form_questions (
 id BIGINT PRIMARY KEY AUTO_INCREMENT, step_id BIGINT NOT NULL, type VARCHAR(30) NOT NULL, label VARCHAR(300) NOT NULL,
 is_required BOOLEAN NOT NULL, help_text VARCHAR(500) NULL, placeholder VARCHAR(300) NULL, max_length INT NULL,
 display_order INT NOT NULL, CONSTRAINT fk_question_step FOREIGN KEY(step_id) REFERENCES form_steps(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE question_options (
 id BIGINT PRIMARY KEY AUTO_INCREMENT, question_id BIGINT NOT NULL, option_value VARCHAR(300) NOT NULL,
 display_order INT NOT NULL, UNIQUE KEY uq_question_option(question_id,option_value),
 CONSTRAINT fk_option_question FOREIGN KEY(question_id) REFERENCES form_questions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE applications (
 id BIGINT PRIMARY KEY AUTO_INCREMENT, public_id VARCHAR(36) NOT NULL UNIQUE, user_id BIGINT NOT NULL,
 recruitment_id BIGINT NOT NULL, submitted_at TIMESTAMP(6) NOT NULL, UNIQUE KEY uq_application_user_recruitment(user_id,recruitment_id),
 CONSTRAINT fk_application_user FOREIGN KEY(user_id) REFERENCES users(id), CONSTRAINT fk_application_recruitment FOREIGN KEY(recruitment_id) REFERENCES recruitments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE application_answers (
 id BIGINT PRIMARY KEY AUTO_INCREMENT, application_id BIGINT NOT NULL, question_id BIGINT NOT NULL, answer_value LONGTEXT NOT NULL,
 UNIQUE KEY uq_application_answer(application_id,question_id), CONSTRAINT fk_answer_application FOREIGN KEY(application_id) REFERENCES applications(id),
 CONSTRAINT fk_answer_question FOREIGN KEY(question_id) REFERENCES form_questions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE resume_submissions (
 id BIGINT PRIMARY KEY AUTO_INCREMENT, application_id BIGINT NOT NULL UNIQUE, question_id BIGINT NOT NULL,
 file_asset_id BIGINT NULL, external_url VARCHAR(2048) NULL,
 CONSTRAINT ck_resume_exactly_one CHECK((file_asset_id IS NULL) <> (external_url IS NULL)),
 CONSTRAINT fk_resume_application FOREIGN KEY(application_id) REFERENCES applications(id),
 CONSTRAINT fk_resume_question FOREIGN KEY(question_id) REFERENCES form_questions(id),
 CONSTRAINT fk_resume_file FOREIGN KEY(file_asset_id) REFERENCES file_assets(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE application_idempotency (
 id BIGINT PRIMARY KEY AUTO_INCREMENT, user_id BIGINT NOT NULL, recruitment_id BIGINT NOT NULL,
 idempotency_key VARCHAR(100) NOT NULL, payload_hash CHAR(64) NOT NULL, application_id BIGINT NOT NULL, created_at TIMESTAMP(6) NOT NULL,
 UNIQUE KEY uq_idempotency(user_id,recruitment_id,idempotency_key),
 CONSTRAINT fk_idem_user FOREIGN KEY(user_id) REFERENCES users(id), CONSTRAINT fk_idem_recruitment FOREIGN KEY(recruitment_id) REFERENCES recruitments(id),
 CONSTRAINT fk_idem_application FOREIGN KEY(application_id) REFERENCES applications(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
