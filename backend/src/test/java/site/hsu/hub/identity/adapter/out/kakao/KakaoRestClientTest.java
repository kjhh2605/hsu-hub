package site.hsu.hub.identity.adapter.out.kakao;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import site.hsu.hub.common.exception.ApiException;
import site.hsu.hub.common.exception.ErrorCode;
import site.hsu.hub.identity.application.port.KakaoIdentityClient.KakaoIdentity;

import java.net.URI;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withBadRequest;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class KakaoRestClientTest {
    private static final URI REDIRECT_URI = URI.create("https://hsu-hub.site/api/v1/auth/kakao/callback");

    private MockRestServiceServer server;
    private KakaoRestClient client;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        KakaoOAuthProperties properties = new KakaoOAuthProperties(
            "test-client-id",
            "test-client-secret",
            URI.create("https://kauth.kakao.com/oauth/authorize"),
            URI.create("https://kauth.kakao.com/oauth/token"),
            URI.create("https://kapi.kakao.com/v2/user/me"),
            URI.create("https://hsu-hub.site"),
            URI.create("https://admin.hsu-hub.site")
        );
        client = new KakaoRestClient(builder.build(), properties);
    }

    @Test
    void exchangesTheCodeAndMapsOnlyTheRequiredIdentityFields() {
        server.expect(once(), requestTo("https://kauth.kakao.com/oauth/token"))
            .andExpect(method(HttpMethod.POST))
            .andExpect(header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_FORM_URLENCODED_VALUE))
            .andExpect(content().string(org.hamcrest.Matchers.allOf(
                org.hamcrest.Matchers.containsString("grant_type=authorization_code"),
                org.hamcrest.Matchers.containsString("client_id=test-client-id"),
                org.hamcrest.Matchers.containsString("client_secret=test-client-secret"),
                org.hamcrest.Matchers.containsString("code=one-time-code"),
                org.hamcrest.Matchers.containsString("redirect_uri=https%3A%2F%2Fhsu-hub.site%2Fapi%2Fv1%2Fauth%2Fkakao%2Fcallback")
            )))
            .andRespond(withSuccess("{\"access_token\":\"access-token\",\"refresh_token\":\"refresh-token\"}", MediaType.APPLICATION_JSON));

        server.expect(once(), requestTo(org.hamcrest.Matchers.allOf(
                org.hamcrest.Matchers.startsWith("https://kapi.kakao.com/v2/user/me?"),
                org.hamcrest.Matchers.containsString("property_keys=%5B%22kakao_account.email%22%5D")
            )))
            .andExpect(method(HttpMethod.GET))
            .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer access-token"))
            .andRespond(withSuccess("""
                {
                  "id": 123456789,
                  "kakao_account": {
                    "email": "user@example.com",
                    "is_email_valid": true,
                    "is_email_verified": true
                  }
                }
                """, MediaType.APPLICATION_JSON));

        KakaoIdentity result = client.exchange("one-time-code", REDIRECT_URI);

        assertThat(result).isEqualTo(new KakaoIdentity(123456789L, "user@example.com", true, true));
        server.verify();
    }

    @Test
    void translatesTokenEndpointFailuresWithoutLeakingProviderData() {
        server.expect(requestTo("https://kauth.kakao.com/oauth/token"))
            .andRespond(withBadRequest().body("access-token refresh-token provider-body"));

        assertThatThrownBy(() -> client.exchange("one-time-code", REDIRECT_URI))
            .isInstanceOfSatisfying(ApiException.class, error -> {
                assertThat(error.code()).isEqualTo(ErrorCode.KAKAO_LOGIN_FAILED);
                assertThat(error.getMessage())
                    .doesNotContain("access-token")
                    .doesNotContain("refresh-token")
                    .doesNotContain("provider-body");
            });
    }

    @Test
    void translatesMalformedUserBodiesWithoutLeakingProviderData() {
        server.expect(requestTo("https://kauth.kakao.com/oauth/token"))
            .andRespond(withSuccess("{\"access_token\":\"access-token\"}", MediaType.APPLICATION_JSON));
        server.expect(requestTo(org.hamcrest.Matchers.startsWith("https://kapi.kakao.com/v2/user/me?")))
            .andRespond(withSuccess("{\"id\":\"provider-body\"}", MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> client.exchange("one-time-code", REDIRECT_URI))
            .isInstanceOfSatisfying(ApiException.class, error -> {
                assertThat(error.code()).isEqualTo(ErrorCode.KAKAO_LOGIN_FAILED);
                assertThat(error.getMessage())
                    .doesNotContain("access-token")
                    .doesNotContain("provider-body");
            });
    }
}
