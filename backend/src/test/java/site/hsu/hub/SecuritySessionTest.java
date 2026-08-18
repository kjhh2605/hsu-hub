package site.hsu.hub;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;
import site.hsu.hub.identity.adapter.out.persistence.UserEntity;
import site.hsu.hub.identity.adapter.out.persistence.UserRepository;
import site.hsu.hub.identity.application.port.KakaoIdentityClient;
import site.hsu.hub.identity.application.port.KakaoIdentityClient.KakaoIdentity;

import java.net.URI;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SecuritySessionTest {
    private static final String OAUTH_COOKIE = "__Host-HSU_OAUTH";
    private static final URI APPLICANT_CALLBACK = URI.create("https://hsu-hub.site/api/v1/auth/kakao/callback");

    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder encoder;
    @MockitoBean KakaoIdentityClient kakao;

    @Test
    void passwordUsesArgon2idAndLoginSetsHostOnlySecureCookie() throws Exception {
        String email = UUID.randomUUID() + "@hansung.ac.kr";
        var user = new UserEntity(email, encoder.encode("password1234"));
        user.verify(Instant.now());
        users.save(user);
        assertThat(user.passwordHash()).startsWith("$argon2id$");
        mvc.perform(post("/api/v1/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"password1234\"}"))
            .andExpect(status().isOk())
            .andExpect(header().string("Set-Cookie", allOf(
                containsString("__Host-HSU_SESSION="), containsString("Path=/"), containsString("Secure"),
                containsString("HttpOnly"), containsString("SameSite=Lax"), not(containsString("Domain=")))));
    }

    @Test
    void kakaoStartUsesOnlyTheTrustedApplicantOriginAndRequiredEmailScope() throws Exception {
        MvcResult result = mvc.perform(get("/api/v1/auth/kakao/start")
                .header("X-HSU-Frontend", "applicant")
                .param("returnTo", "/apply/42?step=2"))
            .andExpect(status().isFound())
            .andReturn();

        URI location = URI.create(result.getResponse().getHeader("Location"));
        var query = UriComponentsBuilder.fromUri(location).build().getQueryParams();
        assertThat(location.getScheme()).isEqualTo("https");
        assertThat(location.getHost()).isEqualTo("kauth.kakao.com");
        assertThat(location.getPath()).isEqualTo("/oauth/authorize");
        assertThat(query.getFirst("client_id")).isEqualTo("test-client-id");
        assertThat(query.getFirst("response_type")).isEqualTo("code");
        assertThat(query.getFirst("scope")).isEqualTo("account_email");
        assertThat(query.getFirst("redirect_uri")).isEqualTo(APPLICANT_CALLBACK.toString());
        assertThat(query.getFirst("state")).isNotBlank();

        assertThat(result.getResponse().getHeaders("Set-Cookie"))
            .anySatisfy(cookie -> assertThat(cookie)
                .contains(OAUTH_COOKIE + "=")
                .contains("Path=/")
                .contains("Max-Age=300")
                .contains("Secure")
                .contains("HttpOnly")
                .contains("SameSite=Lax")
                .doesNotContain("Domain="));
    }

    @Test
    void kakaoCallbackCreatesAHostOnlySessionAndReturnsToTheOriginalPath() throws Exception {
        Pending pending = start("/apply/42?step=2");
        when(kakao.exchange(eq("one-time-code"), eq(APPLICANT_CALLBACK)))
            .thenReturn(new KakaoIdentity(987654321L, "user@example.com", true, true));

        MvcResult result = mvc.perform(get("/api/v1/auth/kakao/callback")
                .header("X-HSU-Frontend", "applicant")
                .cookie(pending.cookie())
                .param("state", pending.state())
                .param("code", "one-time-code"))
            .andExpect(status().isFound())
            .andExpect(redirectedUrl("https://hsu-hub.site/apply/42?step=2"))
            .andReturn();

        assertThat(result.getResponse().getHeaders("Set-Cookie"))
            .anySatisfy(cookie -> assertThat(cookie).contains(OAUTH_COOKIE + "=").contains("Max-Age=0"))
            .anySatisfy(cookie -> assertThat(cookie)
                .contains("__Host-HSU_SESSION=")
                .contains("Max-Age=604800")
                .contains("Path=/")
                .contains("Secure")
                .contains("HttpOnly")
                .contains("SameSite=Lax")
                .doesNotContain("Domain="));
    }

    @Test
    void providerDenialExpiresStateAndRedirectsToCancelledError() throws Exception {
        Pending pending = start("/clubs");

        assertCallbackFailure(pending, "state", pending.state(), "error", "access_denied",
            "https://hsu-hub.site/login?error=kakao_cancelled");
    }

    @Test
    void stateMismatchExpiresStateAndRedirectsToLoginFailed() throws Exception {
        Pending pending = start("/clubs");

        assertCallbackFailure(pending, "state", "different-state", "code", "one-time-code",
            "https://hsu-hub.site/login?error=kakao_login_failed");
    }

    @Test
    void missingCodeExpiresStateAndRedirectsToLoginFailed() throws Exception {
        Pending pending = start("/clubs");

        assertCallbackFailure(pending, "state", pending.state(), "unused", "unused",
            "https://hsu-hub.site/login?error=kakao_login_failed");
    }

    @Test
    void unverifiedEmailExpiresStateAndRedirectsToEmailRequired() throws Exception {
        Pending pending = start("/clubs");
        when(kakao.exchange(eq("one-time-code"), eq(APPLICANT_CALLBACK)))
            .thenReturn(new KakaoIdentity(987654321L, "user@example.com", true, false));

        assertCallbackFailure(pending, "state", pending.state(), "code", "one-time-code",
            "https://hsu-hub.site/login?error=kakao_email_required");
    }

    private Pending start(String returnTo) throws Exception {
        MvcResult result = mvc.perform(get("/api/v1/auth/kakao/start")
                .header("X-HSU-Frontend", "applicant")
                .param("returnTo", returnTo))
            .andExpect(status().isFound())
            .andReturn();
        Cookie cookie = result.getResponse().getCookie(OAUTH_COOKIE);
        URI location = URI.create(result.getResponse().getHeader("Location"));
        String state = UriComponentsBuilder.fromUri(location).build().getQueryParams().getFirst("state");
        return new Pending(cookie, state);
    }

    private void assertCallbackFailure(
        Pending pending,
        String firstName,
        String firstValue,
        String secondName,
        String secondValue,
        String redirect
    ) throws Exception {
        MvcResult result = mvc.perform(get("/api/v1/auth/kakao/callback")
                .header("X-HSU-Frontend", "applicant")
                .cookie(pending.cookie())
                .param(firstName, firstValue)
                .param(secondName, secondValue))
            .andExpect(status().isFound())
            .andExpect(redirectedUrl(redirect))
            .andReturn();
        assertThat(result.getResponse().getHeaders("Set-Cookie"))
            .anySatisfy(cookie -> assertThat(cookie).contains(OAUTH_COOKIE + "=").contains("Max-Age=0"))
            .noneSatisfy(cookie -> assertThat(cookie).contains("__Host-HSU_SESSION="));
    }

    private record Pending(Cookie cookie, String state) {}
}
