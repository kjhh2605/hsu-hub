package site.hsu.hub.identity.application;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import site.hsu.hub.common.exception.ApiException;
import site.hsu.hub.common.exception.ErrorCode;
import site.hsu.hub.identity.adapter.out.persistence.UserEntity;
import site.hsu.hub.identity.adapter.out.persistence.UserRepository;
import site.hsu.hub.identity.adapter.out.persistence.UserSessionEntity;
import site.hsu.hub.identity.adapter.out.persistence.UserSessionRepository;
import site.hsu.hub.identity.api.SessionUser;
import site.hsu.hub.identity.application.port.KakaoIdentityClient;
import site.hsu.hub.identity.application.port.KakaoIdentityClient.KakaoIdentity;
import site.hsu.hub.identity.domain.TokenSupport;
import site.hsu.hub.identity.domain.UserStatus;

import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;

@Service
public class AuthService {
    private final UserRepository users;
    private final UserSessionRepository sessions;
    private final RateLimiter rate;
    private final KakaoIdentityClient kakao;

    public AuthService(
        UserRepository users,
        UserSessionRepository sessions,
        RateLimiter rate,
        KakaoIdentityClient kakao
    ) {
        this.users = users;
        this.sessions = sessions;
        this.rate = rate;
        this.kakao = kakao;
    }

    @Transactional
    public LoginResult loginWithKakao(String code, URI redirectUri, String ip) {
        rate.check("kakao-login:ip:" + ip, 20, Duration.ofMinutes(10));
        KakaoIdentity identity = kakao.exchange(code, redirectUri);
        String email = requireVerifiedEmail(identity);
        Instant now = Instant.now();
        UserEntity user = users.findByKakaoUserId(identity.serviceUserId())
            .map(existing -> {
                existing.updateEmail(email, now);
                return existing;
            })
            .orElseGet(() -> users.save(new UserEntity(identity.serviceUserId(), email)));
        requireActive(user);
        return createSession(user, now);
    }

    @Transactional
    public void logout(String rawSession) {
        if (rawSession == null) return;
        sessions.findById(TokenSupport.sha256(rawSession)).ifPresent(session -> session.revoke(Instant.now()));
    }

    @Transactional
    public SessionUser authenticate(String rawSession) {
        if (rawSession == null) return null;
        Instant now = Instant.now();
        var session = sessions.findById(TokenSupport.sha256(rawSession)).orElse(null);
        if (session == null || session.revokedAt() != null || TokenSupport.isExpired(session.expiresAt(), now)) return null;
        var user = users.findById(session.userId()).orElse(null);
        if (user == null || user.status() != UserStatus.ACTIVE) return null;
        session.touch(now);
        return new SessionUser(user.id(), user.email(), user.serviceRole());
    }

    private LoginResult createSession(UserEntity user, Instant now) {
        String raw = TokenSupport.newRawToken();
        sessions.save(new UserSessionEntity(TokenSupport.sha256(raw), user.id(), now, now.plus(Duration.ofDays(7))));
        return new LoginResult(raw, new SessionUser(user.id(), user.email(), user.serviceRole()));
    }

    private static String requireVerifiedEmail(KakaoIdentity identity) {
        if (identity.email() == null || identity.email().isBlank() || !identity.emailValid() || !identity.emailVerified()) {
            throw new ApiException(ErrorCode.KAKAO_EMAIL_REQUIRED);
        }
        return identity.email().trim().toLowerCase(Locale.ROOT);
    }

    private static void requireActive(UserEntity user) {
        if (user.status() != UserStatus.ACTIVE) throw new ApiException(ErrorCode.FORBIDDEN);
    }

    public record LoginResult(String rawSession, SessionUser user) {}
}
