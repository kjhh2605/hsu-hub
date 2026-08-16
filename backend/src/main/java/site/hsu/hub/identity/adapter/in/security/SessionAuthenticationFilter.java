package site.hsu.hub.identity.adapter.in.security;
import jakarta.servlet.*; import jakarta.servlet.http.*; import org.springframework.security.authentication.UsernamePasswordAuthenticationToken; import org.springframework.security.core.context.SecurityContextHolder; import org.springframework.stereotype.Component; import org.springframework.web.filter.OncePerRequestFilter; import site.hsu.hub.identity.adapter.in.web.AuthController; import site.hsu.hub.identity.application.AuthService;
import java.io.IOException; import java.util.Arrays;
@Component public class SessionAuthenticationFilter extends OncePerRequestFilter {
 private final AuthService auth; public SessionAuthenticationFilter(AuthService auth){this.auth=auth;}
 protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain)throws ServletException,IOException{String raw=req.getCookies()==null?null: Arrays.stream(req.getCookies()).filter(c->AuthController.SESSION_COOKIE.equals(c.getName())).map(Cookie::getValue).findFirst().orElse(null);var user=auth.authenticate(raw);if(user!=null)SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(user,null,java.util.List.of()));chain.doFilter(req,res);}
}
