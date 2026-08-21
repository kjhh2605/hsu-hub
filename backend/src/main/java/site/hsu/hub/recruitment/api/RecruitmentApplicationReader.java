package site.hsu.hub.recruitment.api;
import java.time.Instant;
public interface RecruitmentApplicationReader{Snapshot requireOpen(Long recruitmentId,Instant now);Snapshot get(Long recruitmentId);FormDefinition form(Long recruitmentId);record Snapshot(Long id,Long clubId,Instant opensAt,Instant closesAt){} }
