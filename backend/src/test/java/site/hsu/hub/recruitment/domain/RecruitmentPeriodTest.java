package site.hsu.hub.recruitment.domain;

import org.junit.jupiter.api.Test;
import java.time.Instant;
import static org.assertj.core.api.Assertions.assertThat;

class RecruitmentPeriodTest {
    private final Instant start = Instant.parse("2026-08-16T00:00:00Z");
    private final Instant end = Instant.parse("2026-08-20T00:00:00Z");

    @Test void derivesScheduledOpenAndClosed() {
        var period = new RecruitmentPeriod(start, end);
        assertThat(period.stateAt(start.minusSeconds(1))).isEqualTo(RecruitmentState.SCHEDULED);
        assertThat(period.stateAt(start)).isEqualTo(RecruitmentState.OPEN);
        assertThat(period.stateAt(end)).isEqualTo(RecruitmentState.CLOSED);
    }

    @Test void touchingIntervalsDoNotOverlap() {
        var period = new RecruitmentPeriod(start, end);
        assertThat(period.overlaps(new RecruitmentPeriod(end, end.plusSeconds(60)))).isFalse();
        assertThat(period.overlaps(new RecruitmentPeriod(start.plusSeconds(1), end.plusSeconds(1)))).isTrue();
    }
}
