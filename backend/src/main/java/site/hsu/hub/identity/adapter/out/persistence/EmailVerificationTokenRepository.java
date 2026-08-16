package site.hsu.hub.identity.adapter.out.persistence;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationTokenEntity,Long>{ Optional<EmailVerificationTokenEntity> findByTokenHash(String hash); }
