package site.hsu.hub.club.api;
import java.time.Instant; import java.util.Map;
public interface ClubRecruitmentSummaryReader { Map<Long,Summary> currentForClubs(Iterable<Long> clubIds,Instant now); record Summary(Long recruitmentId,String title,String state,Instant opensAt,Instant closesAt){} }
