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

    @AssertTrue(message = "Frontend origins must be explicit HTTP(S) origins")
    public boolean isFrontendOriginsExplicit() {
        return isOrigin(applicantOrigin) && isOrigin(adminOrigin);
    }

    private static boolean isHttps(URI uri) {
        return uri != null && "https".equalsIgnoreCase(uri.getScheme()) && uri.getHost() != null;
    }

    private static boolean isOrigin(URI uri) {
        if (uri == null || uri.getHost() == null) return false;
        String scheme = uri.getScheme();
        boolean webScheme = "https".equalsIgnoreCase(scheme) || "http".equalsIgnoreCase(scheme);
        String path = uri.getPath();
        return webScheme
            && (path == null || path.isEmpty() || "/".equals(path))
            && uri.getRawQuery() == null
            && uri.getRawFragment() == null
            && uri.getUserInfo() == null;
    }
}
