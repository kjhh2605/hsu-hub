package site.hsu.hub.identity.application;
import org.springframework.stereotype.Component; import site.hsu.hub.common.exception.ApiException; import site.hsu.hub.common.exception.ErrorCode;
import java.time.Clock; import java.time.Duration; import java.time.Instant; import java.util.ArrayDeque; import java.util.concurrent.ConcurrentHashMap;
@Component public class RateLimiter {
 private final ConcurrentHashMap<String,ArrayDeque<Instant>> buckets=new ConcurrentHashMap<>(); private final Clock clock;
 public RateLimiter(){this(Clock.systemUTC());} RateLimiter(Clock clock){this.clock=clock;}
 public void check(String key,int limit,Duration window){Instant now=clock.instant(); ArrayDeque<Instant> q=buckets.computeIfAbsent(key,k->new ArrayDeque<>()); synchronized(q){while(!q.isEmpty()&&!q.peekFirst().isAfter(now.minus(window)))q.removeFirst(); if(q.size()>=limit)throw new ApiException(ErrorCode.RATE_LIMITED);q.addLast(now);}}
}
