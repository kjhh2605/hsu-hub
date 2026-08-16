package site.hsu.hub.identity.api;
import org.springframework.security.core.Authentication; import org.springframework.security.core.context.SecurityContextHolder; import org.springframework.stereotype.Component;
import site.hsu.hub.common.exception.ApiException; import site.hsu.hub.common.exception.ErrorCode;
@Component public class CurrentUser {
 public SessionUser require(){Authentication a=SecurityContextHolder.getContext().getAuthentication(); if(a==null||!(a.getPrincipal() instanceof SessionUser u)||!a.isAuthenticated()) throw new ApiException(ErrorCode.UNAUTHORIZED); return u;}
 public Long id(){return require().id();}
}
