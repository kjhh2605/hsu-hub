package site.hsu.hub.club.api;

public interface ClubApplicationStatusReader {
    boolean hasApplied(Long userId, Long recruitmentId);
}
