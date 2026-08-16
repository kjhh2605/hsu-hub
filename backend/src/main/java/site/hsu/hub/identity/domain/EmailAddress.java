package site.hsu.hub.identity.domain;

import site.hsu.hub.common.exception.ApiException;
import site.hsu.hub.common.exception.ErrorCode;
import java.util.Locale;
import java.util.regex.Pattern;

public record EmailAddress(String value) {
    private static final Pattern BASIC = Pattern.compile("^[^@\\s]+@[^@\\s]+$");
    public static EmailAddress hansung(String raw) {
        String value = raw == null ? "" : raw.trim().toLowerCase(Locale.ROOT);
        if (!BASIC.matcher(value).matches() || !value.endsWith("@hansung.ac.kr")) {
            throw new ApiException(ErrorCode.EMAIL_DOMAIN_NOT_ALLOWED);
        }
        return new EmailAddress(value);
    }
}
