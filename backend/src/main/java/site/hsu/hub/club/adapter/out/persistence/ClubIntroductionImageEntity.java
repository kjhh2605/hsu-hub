package site.hsu.hub.club.adapter.out.persistence;

import jakarta.persistence.*;

@Entity
@Table(name = "club_introduction_images", uniqueConstraints = {
        @UniqueConstraint(name = "uq_club_intro_image_order", columnNames = {"club_id", "display_order"}),
        @UniqueConstraint(name = "uq_club_intro_image_file", columnNames = {"club_id", "file_asset_id"})
})
public class ClubIntroductionImageEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "club_id", nullable = false) private Long clubId;
    @Column(name = "file_asset_id", nullable = false) private Long fileAssetId;
    @Column(name = "display_order", nullable = false) private int displayOrder;

    protected ClubIntroductionImageEntity() {}

    public ClubIntroductionImageEntity(Long clubId, Long fileAssetId, int displayOrder) {
        this.clubId = clubId;
        this.fileAssetId = fileAssetId;
        this.displayOrder = displayOrder;
    }

    public Long id() { return id; }
    public Long clubId() { return clubId; }
    public Long fileAssetId() { return fileAssetId; }
    public int displayOrder() { return displayOrder; }
    public void reorder(int order) { displayOrder = order; }
}
