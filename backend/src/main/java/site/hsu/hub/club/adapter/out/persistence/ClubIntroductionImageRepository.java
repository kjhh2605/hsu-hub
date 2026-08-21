package site.hsu.hub.club.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClubIntroductionImageRepository extends JpaRepository<ClubIntroductionImageEntity, Long> {
    List<ClubIntroductionImageEntity> findByClubIdOrderByDisplayOrder(Long clubId);
    List<ClubIntroductionImageEntity> findByClubIdAndIdIn(Long clubId, List<Long> ids);
}
