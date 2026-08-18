package site.hsu.hub.identity.adapter.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import site.hsu.hub.identity.domain.ServiceRole;
import site.hsu.hub.identity.domain.UserStatus;

import java.time.Instant;

@Entity
@Table(name = "users")
public class UserEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "kakao_user_id", nullable = false, unique = true)
    private long kakaoUserId;

    @Column(name = "email", nullable = false, length = 190)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "service_role", nullable = false)
    private ServiceRole serviceRole = ServiceRole.USER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status = UserStatus.ACTIVE;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected UserEntity() {}

    public UserEntity(long kakaoUserId, String email) {
        this.kakaoUserId = kakaoUserId;
        this.email = email;
        this.createdAt = Instant.now();
        this.updatedAt = createdAt;
    }

    public Long id() { return id; }
    public long kakaoUserId() { return kakaoUserId; }
    public String email() { return email; }
    public ServiceRole serviceRole() { return serviceRole; }
    public UserStatus status() { return status; }

    public void updateEmail(String email, Instant now) {
        this.email = email;
        this.updatedAt = now;
    }
}
