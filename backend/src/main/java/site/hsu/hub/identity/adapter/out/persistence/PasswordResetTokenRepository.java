package site.hsu.hub.identity.adapter.out.persistence;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetTokenEntity,Long>{ Optional<PasswordResetTokenEntity> findByTokenHash(String hash); }
