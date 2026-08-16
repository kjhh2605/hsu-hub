package site.hsu.hub.identity.adapter.out.persistence;

import jakarta.persistence.*;
import java.time.Instant;
@Entity @Table(name="email_verification_tokens")
public class EmailVerificationTokenEntity {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="user_id",nullable=false) private Long userId;
 @Column(name="token_hash",nullable=false,unique=true,length=64) private String tokenHash;
 @Column(name="expires_at",nullable=false) private Instant expiresAt;
 @Column(name="consumed_at") private Instant consumedAt;
 @Column(name="created_at",nullable=false) private Instant createdAt;
 protected EmailVerificationTokenEntity(){}
 public EmailVerificationTokenEntity(Long userId,String tokenHash,Instant expiresAt){this.userId=userId;this.tokenHash=tokenHash;this.expiresAt=expiresAt;this.createdAt=Instant.now();}
 public Long userId(){return userId;} public Instant expiresAt(){return expiresAt;} public Instant consumedAt(){return consumedAt;} public void consume(Instant now){consumedAt=now;}
}
