package site.hsu.hub.recruitment.adapter.out.persistence;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "recruitments")
public class RecruitmentEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "club_id", nullable = false) private Long clubId;
    @Column(name = "opens_at", nullable = false) private Instant opensAt;
    @Column(name = "closes_at", nullable = false) private Instant closesAt;
    @Column(name = "published_at", nullable = false, updatable = false) private Instant publishedAt;
    @Column(name = "created_by", nullable = false, updatable = false) private Long createdBy;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;

    protected RecruitmentEntity() {}

    public RecruitmentEntity(Long clubId, Instant opens, Instant closes, Long user) {
        this.clubId = clubId;
        opensAt = opens;
        closesAt = closes;
        createdBy = user;
        publishedAt = Instant.now();
        createdAt = publishedAt;
    }

    public Long id() { return id; }
    public Long clubId() { return clubId; }
    public Instant opensAt() { return opensAt; }
    public Instant closesAt() { return closesAt; }
    public Instant publishedAt() { return publishedAt; }
}
