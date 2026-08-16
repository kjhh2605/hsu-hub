package site.hsu.hub.club.api;
public interface ClubScope { void requireOperator(Long clubId); void lockOperatorClub(Long clubId); boolean canOperate(Long userId,Long clubId); }
