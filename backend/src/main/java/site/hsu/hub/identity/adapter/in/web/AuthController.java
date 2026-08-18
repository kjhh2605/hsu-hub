package site.hsu.hub.identity.adapter.in.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;
import site.hsu.hub.common.api.ApiResponse;
import site.hsu.hub.common.api.Responses;
import site.hsu.hub.common.exception.ApiException;
import site.hsu.hub.common.exception.ErrorCode;
import site.hsu.hub.identity.adapter.out.kakao.KakaoOAuthProperties;
import site.hsu.hub.identity.api.CurrentUser;
import site.hsu.hub.identity.api.SessionUser;
import site.hsu.hub.identity.application.AuthService;
import site.hsu.hub.identity.application.RateLimiter;

import java.net.URI;
import java.time.Duration;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController implements AuthControllerDocs {
    public static final String SESSION_COOKIE = "__Host-HSU_SESSION";
    public static final String OAUTH_COOKIE = "__Host-HSU_OAUTH";
    public static final String FRONTEND_HEADER = "X-HSU-Frontend";

    private final AuthService auth;
    private final CurrentUser current;
    private final RateLimiter rate;
    private final OAuthStateCodec states;
    private final KakaoOAuthProperties kakao;

    public AuthController(
        AuthService auth,
        CurrentUser current,
        RateLimiter rate,
        OAuthStateCodec states,
        KakaoOAuthProperties kakao
    ) {
        this.auth = auth;
        this.current = current;
        this.rate = rate;
        this.states = states;
        this.kakao = kakao;
    }

    @Override
    @GetMapping("/kakao/start")
    public void kakaoStart(
        @RequestParam(required = false) String returnTo,
        HttpServletRequest request,
        HttpServletResponse response
    ) {
        rate.check("kakao-start:ip:" + ip(request), 20, Duration.ofMinutes(10));
        URI callback = callbackUri(request.getHeader(FRONTEND_HEADER));
        OAuthStateCodec.PendingLogin pending = states.issue(returnTo);
        response.addHeader("Set-Cookie", oauthCookie(pending.cookieValue(), 300).toString());
        URI authorization = UriComponentsBuilder.fromUri(kakao.authorizeUri())
            .queryParam("client_id", kakao.clientId())
            .queryParam("redirect_uri", callback)
            .queryParam("response_type", "code")
            .queryParam("state", pending.state())
            .queryParam("scope", "account_email")
            .encode()
            .build()
            .toUri();
        redirect(response, authorization);
    }

    @Override
    @GetMapping("/kakao/callback")
    public void kakaoCallback(
        @CookieValue(name = OAUTH_COOKIE, required = false) String oauthCookie,
        @RequestParam(required = false) String state,
        @RequestParam(required = false) String code,
        @RequestParam(required = false) String error,
        HttpServletRequest request,
        HttpServletResponse response
    ) {
        response.addHeader("Set-Cookie", oauthCookie("", 0).toString());
        URI origin = frontendOrigin(request.getHeader(FRONTEND_HEADER));
        try {
            rate.check("kakao-callback:ip:" + ip(request), 30, Duration.ofMinutes(10));
            OAuthStateCodec.PendingLogin pending = states.verify(oauthCookie, state);
            if (error != null && !error.isBlank()) {
                redirect(response, origin.resolve("/login?error=kakao_cancelled"));
                return;
            }
            if (code == null || code.isBlank()) throw new ApiException(ErrorCode.BAD_REQUEST);
            var result = auth.loginWithKakao(code, callbackUri(origin), ip(request));
            response.addHeader("Set-Cookie", sessionCookie(result.rawSession(), 7 * 24 * 60 * 60).toString());
            redirect(response, origin.resolve(pending.returnTo()));
        } catch (ApiException exception) {
            String errorCode = exception.code() == ErrorCode.KAKAO_EMAIL_REQUIRED
                ? "kakao_email_required"
                : "kakao_login_failed";
            redirect(response, origin.resolve("/login?error=" + errorCode));
        }
    }

    @Override
    @PostMapping("/signup")
    public ApiResponse<Void> signup(@Valid @RequestBody SignupRequest body, HttpServletRequest request) {
        auth.signup(body.email(), body.password(), ip(request));
        return Responses.ok(null, request);
    }

    @Override
    @PostMapping("/email-verifications/resend")
    public ApiResponse<Void> resend(@Valid @RequestBody EmailRequest body, HttpServletRequest request) {
        auth.resend(body.email(), ip(request));
        return Responses.ok(null, request);
    }

    @Override
    @PostMapping("/email-verifications/confirm")
    public ApiResponse<Void> confirmEmail(@Valid @RequestBody TokenRequest body, HttpServletRequest request) {
        auth.confirmEmail(body.token());
        return Responses.ok(null, request);
    }

    @Override
    @PostMapping("/login")
    public ApiResponse<SessionResponse> login(
        @Valid @RequestBody LoginRequest body,
        HttpServletRequest request,
        HttpServletResponse response
    ) {
        var result = auth.login(body.email(), body.password(), ip(request));
        response.addHeader("Set-Cookie", sessionCookie(result.rawSession(), 7 * 24 * 60 * 60).toString());
        return Responses.ok(SessionResponse.from(result.user()), request);
    }

    @Override
    @PostMapping("/logout")
    public ApiResponse<Void> logout(
        @CookieValue(name = SESSION_COOKIE, required = false) String session,
        HttpServletRequest request,
        HttpServletResponse response
    ) {
        auth.logout(session);
        response.addHeader("Set-Cookie", sessionCookie("", 0).toString());
        return Responses.ok(null, request);
    }

    @Override
    @PostMapping("/password-resets/request")
    public ApiResponse<Void> requestReset(@Valid @RequestBody EmailRequest body, HttpServletRequest request) {
        auth.requestReset(body.email(), ip(request));
        return Responses.ok(null, request);
    }

    @Override
    @PostMapping("/password-resets/confirm")
    public ApiResponse<Void> confirmReset(@Valid @RequestBody ResetConfirmRequest body, HttpServletRequest request) {
        auth.confirmReset(body.token(), body.password());
        return Responses.ok(null, request);
    }

    @Override
    @GetMapping("/session")
    public ApiResponse<SessionResponse> session(HttpServletRequest request) {
        return Responses.ok(SessionResponse.from(current.require()), request);
    }

    private URI callbackUri(String frontend) {
        return callbackUri(frontendOrigin(frontend));
    }

    private static URI callbackUri(URI origin) {
        return origin.resolve("/api/v1/auth/kakao/callback");
    }

    private URI frontendOrigin(String frontend) {
        if ("applicant".equals(frontend)) return kakao.applicantOrigin();
        if ("admin".equals(frontend)) return kakao.adminOrigin();
        throw new ApiException(ErrorCode.BAD_REQUEST, "허용되지 않은 프론트엔드입니다.");
    }

    private static ResponseCookie sessionCookie(String value, long age) {
        return ResponseCookie.from(SESSION_COOKIE, value)
            .httpOnly(true)
            .secure(true)
            .sameSite("Lax")
            .path("/")
            .maxAge(age)
            .build();
    }

    private static ResponseCookie oauthCookie(String value, long age) {
        return ResponseCookie.from(OAUTH_COOKIE, value)
            .httpOnly(true)
            .secure(true)
            .sameSite("Lax")
            .path("/")
            .maxAge(age)
            .build();
    }

    private static void redirect(HttpServletResponse response, URI target) {
        response.setStatus(HttpServletResponse.SC_FOUND);
        response.setHeader("Location", target.toASCIIString());
    }

    private static String ip(HttpServletRequest request) {
        String forwarded = request.getHeader("CloudFront-Viewer-Address");
        return forwarded == null ? request.getRemoteAddr() : forwarded.split(":")[0];
    }

    public record SignupRequest(@Email @NotBlank String email, @NotBlank @Size(min = 10, max = 200) String password) {}
    public record LoginRequest(@Email @NotBlank String email, @NotBlank String password) {}
    public record EmailRequest(@Email @NotBlank String email) {}
    public record TokenRequest(@NotBlank String token) {}
    public record ResetConfirmRequest(@NotBlank String token, @NotBlank @Size(min = 10, max = 200) String password) {}
    public record SessionResponse(Long id, String email, String role) {
        static SessionResponse from(SessionUser user) {
            return new SessionResponse(user.id(), user.email(), user.role().name());
        }
    }
}
