package site.hsu.hub.application.adapter.out.persistence;

import org.springframework.stereotype.Component;
import site.hsu.hub.club.api.ClubApplicationStatusReader;

@Component
public class ApplicationStatusReaderAdapter implements ClubApplicationStatusReader {
    private final ApplicationRepository applications;

    public ApplicationStatusReaderAdapter(ApplicationRepository applications) {
        this.applications = applications;
    }

    @Override
    public boolean hasApplied(Long userId, Long recruitmentId) {
        return applications.findByUserIdAndRecruitmentId(userId, recruitmentId).isPresent();
    }
}
