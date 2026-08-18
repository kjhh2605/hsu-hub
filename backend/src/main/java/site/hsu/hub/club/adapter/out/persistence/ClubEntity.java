package site.hsu.hub.club.adapter.out.persistence;

import jakarta.persistence.*;
import site.hsu.hub.club.domain.ClubRecruitmentStatus;
import java.time.Instant;

@Entity
@Table(name = "clubs")
public class ClubEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 100) private String name;
    @Column(nullable = false, length = 50) private String category;
    @Column(name = "short_introduction", length = 240) private String shortIntroduction;
    @Column(name = "detailed_introduction", columnDefinition = "LONGTEXT") private String detailedIntroduction;
    @Enumerated(EnumType.STRING) @Column(name = "recruitment_status", nullable = false, length = 20)
    private ClubRecruitmentStatus recruitmentStatus;
    @Column(name = "cover_file_asset_id") private Long coverFileAssetId;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;

    protected ClubEntity() {}

    public ClubEntity(String name, String category) {
        this.name = name;
        this.category = category;
        this.recruitmentStatus = ClubRecruitmentStatus.CLOSED;
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    public Long id() { return id; }
    public String name() { return name; }
    public String category() { return category; }
    public String shortIntroduction() { return shortIntroduction; }
    public String detailedIntroduction() { return detailedIntroduction; }
    public ClubRecruitmentStatus recruitmentStatus() { return recruitmentStatus; }
    public Long coverFileAssetId() { return coverFileAssetId; }
    public void update(String shortIntro, String detail, ClubRecruitmentStatus status) {
        shortIntroduction = shortIntro;
        detailedIntroduction = detail;
        recruitmentStatus = status;
        updatedAt = Instant.now();
    }
    public Long replaceCover(Long id) { Long old = coverFileAssetId; coverFileAssetId = id; updatedAt = Instant.now(); return old; }
}
