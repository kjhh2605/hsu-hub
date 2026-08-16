package site.hsu.hub.identity.adapter.out.persistence;
import org.springframework.data.jpa.repository.JpaRepository;
public interface UserSessionRepository extends JpaRepository<UserSessionEntity,String>{}
