package site.hsu.hub.recruitment.domain;

import site.hsu.hub.common.exception.ApiException;
import site.hsu.hub.common.exception.ErrorCode;
import java.time.Instant;

public record RecruitmentPeriod(Instant opensAt, Instant closesAt) {
    public RecruitmentPeriod {
        if (opensAt == null || closesAt == null || !opensAt.isBefore(closesAt))
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "모집 시작 시각은 종료 시각보다 빨라야 합니다.");
    }
    public RecruitmentState stateAt(Instant now) {
        if (now.isBefore(opensAt)) return RecruitmentState.SCHEDULED;
        if (!now.isBefore(closesAt)) return RecruitmentState.CLOSED;
        return RecruitmentState.OPEN;
    }
    public boolean overlaps(RecruitmentPeriod other) {
        return opensAt.isBefore(other.closesAt) && other.opensAt.isBefore(closesAt);
    }
}
