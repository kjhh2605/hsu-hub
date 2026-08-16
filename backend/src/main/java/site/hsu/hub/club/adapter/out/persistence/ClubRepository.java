package site.hsu.hub.club.adapter.out.persistence;
import jakarta.persistence.LockModeType;import org.springframework.data.jpa.repository.*;import org.springframework.data.repository.query.Param;import java.util.Optional;
public interface ClubRepository extends JpaRepository<ClubEntity,Long>{@Lock(LockModeType.PESSIMISTIC_WRITE)@Query("select c from ClubEntity c where c.id=:id")Optional<ClubEntity> findByIdForUpdate(@Param("id")Long id);}
