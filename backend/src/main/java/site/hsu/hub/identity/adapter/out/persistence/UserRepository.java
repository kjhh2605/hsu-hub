package site.hsu.hub.identity.adapter.out.persistence;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface UserRepository extends JpaRepository<UserEntity,Long> {
    Optional<UserEntity> findByEmail(String email);
    Optional<UserEntity> findByKakaoUserId(Long kakaoUserId);
}
