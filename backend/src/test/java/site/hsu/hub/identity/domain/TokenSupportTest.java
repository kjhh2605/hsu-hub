package site.hsu.hub.identity.domain;

import org.junit.jupiter.api.Test;
import java.time.Instant;
import static org.assertj.core.api.Assertions.assertThat;

class TokenSupportTest {
    @Test void rawTokenIsNeverEqualToStoredHash() {
        String raw = TokenSupport.newRawToken();
        assertThat(TokenSupport.sha256(raw)).isNotEqualTo(raw);
        assertThat(TokenSupport.sha256(raw)).hasSize(64);
    }

    @Test void tokenAtExpiryIsExpired() {
        Instant expiry = Instant.parse("2026-08-16T00:00:00Z");
        assertThat(TokenSupport.isExpired(expiry, expiry)).isTrue();
        assertThat(TokenSupport.isExpired(expiry, expiry.minusNanos(1))).isFalse();
    }
}
