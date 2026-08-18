package site.hsu.hub.identity.adapter.out.kakao;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.net.URI;

@Validated
@ConfigurationProperties("hsu.kakao")
public record KakaoOAuthProperties(
    @NotBlank String clientId,
    @NotBlank String clientSecret,
    @NotNull URI authorizeUri,
    @NotNull URI tokenUri,
    @NotNull URI userInfoUri,
    @NotNull URI applicantOrigin,
    @NotNull URI adminOrigin
) {
    @AssertTrue(message = "Kakao provider endpoints must use HTTPS")
    public boolean isProviderEndpointsHttps() {
        return isHttps(authorizeUri) && isHttps(tokenUri) && isHttps(userInfoUri);
    }

    private static boolean isHttps(URI uri) {
        return uri != null && "https".equalsIgnoreCase(uri.getScheme()) && uri.getHost() != null;
    }
}
