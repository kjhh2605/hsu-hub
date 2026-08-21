ALTER TABLE clubs
    ADD COLUMN recruitment_status VARCHAR(20) NOT NULL DEFAULT 'CLOSED' AFTER detailed_introduction;

CREATE TABLE club_introduction_images (
 id BIGINT PRIMARY KEY AUTO_INCREMENT, club_id BIGINT NOT NULL, file_asset_id BIGINT NOT NULL,
 display_order INT NOT NULL,
 UNIQUE KEY uq_club_intro_image_order(club_id,display_order),
 UNIQUE KEY uq_club_intro_image_file(club_id,file_asset_id),
 CONSTRAINT fk_intro_image_club FOREIGN KEY(club_id) REFERENCES clubs(id),
 CONSTRAINT fk_intro_image_file FOREIGN KEY(file_asset_id) REFERENCES file_assets(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
