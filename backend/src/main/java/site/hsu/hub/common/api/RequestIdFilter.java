package site.hsu.hub.common.api;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.security.SecureRandom;
import java.time.Instant;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestIdFilter extends OncePerRequestFilter {
    public static final String REQUEST_ID = "requestId";
    private static final SecureRandom RANDOM = new SecureRandom();

    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                               FilterChain chain) throws ServletException, IOException {
        String id = ulidLike();
        request.setAttribute(REQUEST_ID, id);
        response.setHeader("X-Request-ID", id);
        MDC.put(REQUEST_ID, id);
        try { chain.doFilter(request, response); } finally { MDC.remove(REQUEST_ID); }
    }

    private static String ulidLike() {
        byte[] random = new byte[10];
        RANDOM.nextBytes(random);
        return Long.toUnsignedString(Instant.now().toEpochMilli(), 36).toUpperCase()
                + java.util.HexFormat.of().formatHex(random).toUpperCase();
    }
}
