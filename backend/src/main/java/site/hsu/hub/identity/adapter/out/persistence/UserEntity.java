package site.hsu.hub.identity.adapter.out.persistence;

import jakarta.persistence.*;
import site.hsu.hub.identity.domain.ServiceRole;
import site.hsu.hub.identity.domain.UserStatus;
import java.time.Instant;

@Entity @Table(name="users")
public class UserEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="kakao_user_id", unique=true) private Long kakaoUserId;
    @Column(name="email_normalized", nullable=false, unique=true, length=190) private String email;
    @Column(name="password_hash", nullable=false, length=255) private String passwordHash;
    @Column(name="email_verified_at") private Instant emailVerifiedAt;
    @Enumerated(EnumType.STRING) @Column(name="service_role", nullable=false) private ServiceRole serviceRole = ServiceRole.USER;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private UserStatus status = UserStatus.ACTIVE;
    @Column(name="created_at", nullable=false) private Instant createdAt;
    @Column(name="updated_at", nullable=false) private Instant updatedAt;
    protected UserEntity() {}
    public UserEntity(String email, String passwordHash) { this.email=email; this.passwordHash=passwordHash; this.createdAt=Instant.now(); this.updatedAt=createdAt; }
    public UserEntity(long kakaoUserId, String email) { this.kakaoUserId=kakaoUserId; this.email=email; this.passwordHash=""; this.createdAt=Instant.now(); this.updatedAt=createdAt; }
    public Long id(){return id;} public String email(){return email;} public String passwordHash(){return passwordHash;}
    public Long kakaoUserId(){return kakaoUserId;}
    public Instant emailVerifiedAt(){return emailVerifiedAt;} public ServiceRole serviceRole(){return serviceRole;} public UserStatus status(){return status;}
    public void verify(Instant now){emailVerifiedAt=now; updatedAt=now;} public void changePassword(String hash){passwordHash=hash; updatedAt=Instant.now();}
    public void updateEmail(String email, Instant now){this.email=email;this.updatedAt=now;}
}
