package site.hsu.hub.identity.adapter.out.persistence;

import jakarta.persistence.*;
import java.time.Instant;
@Entity @Table(name="user_sessions")
public class UserSessionEntity {
 @Id @Column(name="session_hash",length=64) private String sessionHash;
 @Column(name="user_id",nullable=false) private Long userId;
 @Column(name="created_at",nullable=false) private Instant createdAt;
 @Column(name="last_seen_at",nullable=false) private Instant lastSeenAt;
 @Column(name="expires_at",nullable=false) private Instant expiresAt;
 @Column(name="revoked_at") private Instant revokedAt;
 protected UserSessionEntity(){}
 public UserSessionEntity(String hash,Long userId,Instant now,Instant expires){sessionHash=hash;this.userId=userId;createdAt=now;lastSeenAt=now;expiresAt=expires;}
 public Long userId(){return userId;} public Instant expiresAt(){return expiresAt;} public Instant revokedAt(){return revokedAt;}
 public void touch(Instant now){lastSeenAt=now;} public void revoke(Instant now){revokedAt=now;}
}
