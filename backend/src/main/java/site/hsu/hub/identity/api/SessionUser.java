package site.hsu.hub.identity.api;
import site.hsu.hub.identity.domain.ServiceRole;
public record SessionUser(Long id,String email,ServiceRole role) { public boolean serviceAdmin(){return role==ServiceRole.SERVICE_ADMIN;} }
