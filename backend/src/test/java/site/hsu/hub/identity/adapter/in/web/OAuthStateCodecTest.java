package site.hsu.hub.identity.adapter.in.web;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import site.hsu.hub.common.exception.ApiException;
import site.hsu.hub.common.exception.ErrorCode;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OAuthStateCodecTest {
    private final OAuthStateCodec codec = new OAuthStateCodec();

    @Test
    void issueAndVerifyRoundTripsAnInternalReturnPath() {
        OAuthStateCodec.PendingLogin pending = codec.issue("/apply/42?step=2");

        OAuthStateCodec.PendingLogin verified = codec.verify(pending.cookieValue(), pending.state());

        assertThat(verified.state()).isEqualTo(pending.state());
        assertThat(verified.returnTo()).isEqualTo("/apply/42?step=2");
    }

    @Test
    void verifyRejectsADifferentReturnedState() {
        OAuthStateCodec.PendingLogin pending = codec.issue("/clubs");

        assertThatThrownBy(() -> codec.verify(pending.cookieValue(), "different-state"))
            .isInstanceOfSatisfying(ApiException.class,
                error -> assertThat(error.code()).isEqualTo(ErrorCode.BAD_REQUEST));
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {
        "https://evil.example",
        "//evil.example",
        "/\\evil",
        "/clubs\r\nLocation: https://evil.example"
    })
    void unsafeReturnPathsFallBackToClubs(String rawReturnTo) {
        OAuthStateCodec.PendingLogin pending = codec.issue(rawReturnTo);

        OAuthStateCodec.PendingLogin verified = codec.verify(pending.cookieValue(), pending.state());

        assertThat(verified.returnTo()).isEqualTo("/clubs");
    }
}
