package site.hsu.hub.identity.adapter.in.web;

import org.springframework.stereotype.Component;
import site.hsu.hub.common.exception.ApiException;
import site.hsu.hub.common.exception.ErrorCode;
import site.hsu.hub.identity.domain.TokenSupport;

import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class OAuthStateCodec {
    private static final String DEFAULT_RETURN_TO = "/clubs";
    private static final Duration STATE_TTL = Duration.ofMinutes(5);
    private final Clock clock;
    private final ConcurrentHashMap<String, Instant> issuedStates = new ConcurrentHashMap<>();

    public OAuthStateCodec() {
        this(Clock.systemUTC());
    }

    OAuthStateCodec(Clock clock) {
        this.clock = clock;
    }

    public PendingLogin issue(String rawReturnTo) {
        Instant now = clock.instant();
        issuedStates.entrySet().removeIf(entry -> !now.isBefore(entry.getValue()));
        String state = TokenSupport.newRawToken();
        issuedStates.put(TokenSupport.sha256(state), now.plus(STATE_TTL));
        String returnTo = safeReturnTo(rawReturnTo);
        String cookieValue = Base64.getUrlEncoder().withoutPadding()
            .encodeToString((state + "\n" + returnTo).getBytes(StandardCharsets.UTF_8));
        return new PendingLogin(cookieValue, state, returnTo);
    }

    public PendingLogin verify(String cookieValue, String returnedState) {
        try {
            String decoded = decode(cookieValue);
            int separator = decoded.indexOf('\n');
            if (separator <= 0 || separator != decoded.lastIndexOf('\n')) throw invalidState();
            String expectedState = decoded.substring(0, separator);
            String returnTo = decoded.substring(separator + 1);
            Instant expiresAt = issuedStates.remove(TokenSupport.sha256(expectedState));
            if (expiresAt == null || TokenSupport.isExpired(expiresAt, clock.instant())
                || returnedState == null || !MessageDigest.isEqual(
                expectedState.getBytes(StandardCharsets.UTF_8),
                returnedState.getBytes(StandardCharsets.UTF_8)
            )) {
                throw invalidState();
            }
            return new PendingLogin(cookieValue, expectedState, safeReturnTo(returnTo));
        } catch (ApiException exception) {
            throw exception;
        } catch (RuntimeException | CharacterCodingException exception) {
            throw invalidState();
        }
    }

    private static String decode(String cookieValue) throws CharacterCodingException {
        if (cookieValue == null || cookieValue.isBlank()) throw invalidState();
        byte[] bytes = Base64.getUrlDecoder().decode(cookieValue);
        return StandardCharsets.UTF_8.newDecoder()
            .onMalformedInput(CodingErrorAction.REPORT)
            .onUnmappableCharacter(CodingErrorAction.REPORT)
            .decode(ByteBuffer.wrap(bytes))
            .toString();
    }

    private static String safeReturnTo(String raw) {
        if (raw == null || raw.isBlank() || !raw.startsWith("/") || raw.startsWith("//") || raw.contains("\\")) {
            return DEFAULT_RETURN_TO;
        }
        for (int index = 0; index < raw.length(); index++) {
            char character = raw.charAt(index);
            if (Character.isISOControl(character)) return DEFAULT_RETURN_TO;
        }
        return raw;
    }

    private static ApiException invalidState() {
        return new ApiException(ErrorCode.BAD_REQUEST, "로그인 요청이 만료되었거나 올바르지 않습니다.");
    }

    public record PendingLogin(String cookieValue, String state, String returnTo) {}
}
