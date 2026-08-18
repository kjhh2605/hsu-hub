package site.hsu.hub.identity.application.port;

import java.net.URI;

public interface KakaoIdentityClient {
    KakaoIdentity exchange(String code, URI redirectUri);

    record KakaoIdentity(long serviceUserId, String email, boolean emailValid, boolean emailVerified) {}
}
