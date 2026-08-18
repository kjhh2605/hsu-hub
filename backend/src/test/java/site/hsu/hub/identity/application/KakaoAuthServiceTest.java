package site.hsu.hub.identity.application;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import site.hsu.hub.common.exception.ApiException;
import site.hsu.hub.common.exception.ErrorCode;
import site.hsu.hub.identity.adapter.out.persistence.UserEntity;
import site.hsu.hub.identity.adapter.out.persistence.UserRepository;
import site.hsu.hub.identity.adapter.out.persistence.UserSessionRepository;
import site.hsu.hub.identity.application.port.KakaoIdentityClient;
import site.hsu.hub.identity.application.port.KakaoIdentityClient.KakaoIdentity;

import java.net.URI;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
@Import(KakaoAuthServiceTest.FakeConfiguration.class)
class KakaoAuthServiceTest {
    private static final URI REDIRECT_URI = URI.create("https://hsu-hub.site/api/v1/auth/kakao/callback");

    @Autowired AuthService auth;
    @Autowired UserRepository users;
    @Autowired UserSessionRepository sessions;
    @Autowired FakeKakaoIdentityClient kakao;
    @Autowired JdbcTemplate jdbc;
    @Autowired EntityManager entityManager;

    @BeforeEach
    void setUp() {
        kakao.identity = verifiedIdentity("user@example.com");
    }

    @Test
    void createsALocalUserAndOpaqueSessionFromAKakaoIdentity() {
        var result = auth.loginWithKakao("one-time-code", REDIRECT_URI, "203.0.113.1");

        assertThat(users.findByKakaoUserId(123456789L)).get()
            .extracting(UserEntity::email).isEqualTo("user@example.com");
        assertThat(result.rawSession()).isNotBlank();
        assertThat(sessions.count()).isEqualTo(1);
    }

    @Test
    void repeatLoginDoesNotCreateASecondUser() {
        auth.loginWithKakao("first-code", REDIRECT_URI, "203.0.113.2");

        auth.loginWithKakao("second-code", REDIRECT_URI, "203.0.113.2");

        assertThat(users.count()).isEqualTo(1);
        assertThat(sessions.count()).isEqualTo(2);
    }

    @Test
    void changedEmailUpdatesTheSameKakaoUser() {
        var first = auth.loginWithKakao("first-code", REDIRECT_URI, "203.0.113.3");
        kakao.identity = verifiedIdentity(" New.Email@Example.COM ");

        var second = auth.loginWithKakao("second-code", REDIRECT_URI, "203.0.113.3");

        assertThat(second.user().id()).isEqualTo(first.user().id());
        assertThat(users.findByKakaoUserId(123456789L)).get()
            .extracting(UserEntity::email).isEqualTo("new.email@example.com");
    }

    @Test
    void missingEmailIsRejectedWithoutCreatingAUser() {
        kakao.identity = new KakaoIdentity(123456789L, null, true, true);

        assertEmailRequired("203.0.113.4");
    }

    @Test
    void invalidEmailIsRejectedWithoutCreatingAUser() {
        kakao.identity = new KakaoIdentity(123456789L, "user@example.com", false, true);

        assertEmailRequired("203.0.113.5");
    }

    @Test
    void unverifiedEmailIsRejectedWithoutCreatingAUser() {
        kakao.identity = new KakaoIdentity(123456789L, "user@example.com", true, false);

        assertEmailRequired("203.0.113.6");
    }

    @Test
    void lockedLocalUserCannotCreateASession() {
        users.saveAndFlush(new UserEntity(123456789L, "user@example.com"));
        jdbc.update("update users set status = 'LOCKED' where kakao_user_id = ?", 123456789L);
        entityManager.clear();

        assertInactiveUserRejected("203.0.113.7");
    }

    @Test
    void withdrawnLocalUserCannotCreateASession() {
        users.saveAndFlush(new UserEntity(123456789L, "user@example.com"));
        jdbc.update("update users set status = 'WITHDRAWN' where kakao_user_id = ?", 123456789L);
        entityManager.clear();

        assertInactiveUserRejected("203.0.113.8");
    }

    private void assertEmailRequired(String ip) {
        assertThatThrownBy(() -> auth.loginWithKakao("one-time-code", REDIRECT_URI, ip))
            .isInstanceOfSatisfying(ApiException.class,
                error -> assertThat(error.code()).isEqualTo(ErrorCode.KAKAO_EMAIL_REQUIRED));
        assertThat(users.count()).isZero();
        assertThat(sessions.count()).isZero();
    }

    private void assertInactiveUserRejected(String ip) {
        assertThatThrownBy(() -> auth.loginWithKakao("one-time-code", REDIRECT_URI, ip))
            .isInstanceOfSatisfying(ApiException.class,
                error -> assertThat(error.code()).isEqualTo(ErrorCode.FORBIDDEN));
        assertThat(sessions.count()).isZero();
    }

    private static KakaoIdentity verifiedIdentity(String email) {
        return new KakaoIdentity(123456789L, email, true, true);
    }

    @TestConfiguration
    static class FakeConfiguration {
        @Bean
        @Primary
        FakeKakaoIdentityClient fakeKakaoIdentityClient() {
            return new FakeKakaoIdentityClient();
        }
    }

    static class FakeKakaoIdentityClient implements KakaoIdentityClient {
        KakaoIdentity identity;

        @Override
        public KakaoIdentity exchange(String code, URI redirectUri) {
            return identity;
        }
    }
}
