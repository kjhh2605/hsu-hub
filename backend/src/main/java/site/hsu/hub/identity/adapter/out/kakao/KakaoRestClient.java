package site.hsu.hub.identity.adapter.out.kakao;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;
import site.hsu.hub.common.exception.ApiException;
import site.hsu.hub.common.exception.ErrorCode;
import site.hsu.hub.identity.application.port.KakaoIdentityClient;

import java.net.URI;

@Component
public class KakaoRestClient implements KakaoIdentityClient {
    private static final String EMAIL_PROPERTY_KEYS = "[\"kakao_account.email\"]";

    private final RestClient http;
    private final KakaoOAuthProperties properties;

    public KakaoRestClient(@Qualifier("kakaoHttpClient") RestClient http, KakaoOAuthProperties properties) {
        this.http = http;
        this.properties = properties;
    }

    @Override
    public KakaoIdentity exchange(String code, URI redirectUri) {
        try {
            String accessToken = exchangeCode(code, redirectUri);
            return fetchIdentity(accessToken);
        } catch (ApiException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            throw loginFailed();
        }
    }

    private String exchangeCode(String code, URI redirectUri) {
        var form = new LinkedMultiValueMap<String, String>();
        form.add("grant_type", "authorization_code");
        form.add("client_id", properties.clientId());
        form.add("client_secret", properties.clientSecret());
        form.add("code", code);
        form.add("redirect_uri", redirectUri.toString());

        TokenResponse response = http.post()
            .uri(properties.tokenUri())
            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
            .body(form)
            .retrieve()
            .body(TokenResponse.class);
        if (response == null || response.accessToken() == null || response.accessToken().isBlank()) {
            throw loginFailed();
        }
        return response.accessToken();
    }

    private KakaoIdentity fetchIdentity(String accessToken) {
        URI uri = UriComponentsBuilder.fromUri(properties.userInfoUri())
            .queryParam("property_keys", EMAIL_PROPERTY_KEYS)
            .encode()
            .build()
            .toUri();
        KakaoUserResponse response = http.get()
            .uri(uri)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
            .retrieve()
            .body(KakaoUserResponse.class);
        if (response == null || response.id() <= 0 || response.account() == null) {
            throw loginFailed();
        }
        return new KakaoIdentity(
            response.id(),
            response.account().email(),
            Boolean.TRUE.equals(response.account().emailValid()),
            Boolean.TRUE.equals(response.account().emailVerified())
        );
    }

    private static ApiException loginFailed() {
        return new ApiException(ErrorCode.KAKAO_LOGIN_FAILED);
    }

    private record TokenResponse(@JsonProperty("access_token") String accessToken) {}

    private record KakaoUserResponse(
        long id,
        @JsonProperty("kakao_account") KakaoAccount account
    ) {}

    private record KakaoAccount(
        String email,
        @JsonProperty("is_email_valid") Boolean emailValid,
        @JsonProperty("is_email_verified") Boolean emailVerified
    ) {}
}
