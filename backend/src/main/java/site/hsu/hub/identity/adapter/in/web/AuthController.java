package site.hsu.hub.identity.adapter.in.web;

import jakarta.servlet.http.*; import jakarta.validation.Valid; import jakarta.validation.constraints.*;
import org.springframework.http.ResponseCookie; import org.springframework.web.bind.annotation.*;
import site.hsu.hub.common.api.*; import site.hsu.hub.identity.api.CurrentUser; import site.hsu.hub.identity.application.AuthService;

@RestController @RequestMapping("/api/v1/auth")
public class AuthController implements AuthControllerDocs {
 public static final String SESSION_COOKIE="__Host-HSU_SESSION"; private final AuthService auth; private final CurrentUser current;
 public AuthController(AuthService auth,CurrentUser current){this.auth=auth;this.current=current;}
 @Override@PostMapping("/signup") public ApiResponse<Void> signup(@Valid @RequestBody SignupRequest body,HttpServletRequest req){auth.signup(body.email(),body.password(),ip(req));return Responses.ok(null,req);}
 @Override@PostMapping("/email-verifications/resend") public ApiResponse<Void> resend(@Valid @RequestBody EmailRequest body,HttpServletRequest req){auth.resend(body.email(),ip(req));return Responses.ok(null,req);}
 @Override@PostMapping("/email-verifications/confirm") public ApiResponse<Void> confirmEmail(@Valid @RequestBody TokenRequest body,HttpServletRequest req){auth.confirmEmail(body.token());return Responses.ok(null,req);}
 @Override@PostMapping("/login") public ApiResponse<SessionResponse> login(@Valid @RequestBody LoginRequest body,HttpServletRequest req,HttpServletResponse response){var result=auth.login(body.email(),body.password(),ip(req));response.addHeader("Set-Cookie",cookie(result.rawSession(),7*24*60*60).toString());return Responses.ok(SessionResponse.from(result.user()),req);}
 @Override@PostMapping("/logout") public ApiResponse<Void> logout(@CookieValue(name=SESSION_COOKIE,required=false) String session,HttpServletRequest req,HttpServletResponse response){auth.logout(session);response.addHeader("Set-Cookie",cookie("",0).toString());return Responses.ok(null,req);}
 @Override@PostMapping("/password-resets/request") public ApiResponse<Void> requestReset(@Valid @RequestBody EmailRequest body,HttpServletRequest req){auth.requestReset(body.email(),ip(req));return Responses.ok(null,req);}
 @Override@PostMapping("/password-resets/confirm") public ApiResponse<Void> confirmReset(@Valid @RequestBody ResetConfirmRequest body,HttpServletRequest req){auth.confirmReset(body.token(),body.password());return Responses.ok(null,req);}
 @Override@GetMapping("/session") public ApiResponse<SessionResponse> session(HttpServletRequest req){return Responses.ok(SessionResponse.from(current.require()),req);}
 private static ResponseCookie cookie(String value,long age){return ResponseCookie.from(SESSION_COOKIE,value).httpOnly(true).secure(true).sameSite("Lax").path("/").maxAge(age).build();}
 private static String ip(HttpServletRequest r){String forwarded=r.getHeader("CloudFront-Viewer-Address");return forwarded==null?r.getRemoteAddr():forwarded.split(":")[0];}
 public record SignupRequest(@Email @NotBlank String email,@NotBlank @Size(min=10,max=200) String password){}
 public record LoginRequest(@Email @NotBlank String email,@NotBlank String password){}
 public record EmailRequest(@Email @NotBlank String email){}
 public record TokenRequest(@NotBlank String token){}
 public record ResetConfirmRequest(@NotBlank String token,@NotBlank @Size(min=10,max=200) String password){}
 public record SessionResponse(Long id,String email,String role){static SessionResponse from(site.hsu.hub.identity.api.SessionUser u){return new SessionResponse(u.id(),u.email(),u.role().name());}}
}
