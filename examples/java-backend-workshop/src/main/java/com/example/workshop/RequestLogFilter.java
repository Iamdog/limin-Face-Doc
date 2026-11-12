package com.example.workshop;

import java.io.IOException;
import java.util.UUID;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.*;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestLogFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(RequestLogFilter.class);
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                     FilterChain chain) throws ServletException, IOException {
        String id = UUID.randomUUID().toString();
        request.setAttribute("requestId", id);
        response.setHeader("X-Request-Id", id);
        long start = System.nanoTime();
        try (MDC.MDCCloseable ignored = MDC.putCloseable("requestId", id)) {
            try {
                chain.doFilter(request, response);
            } finally {
                log.info("method={} path={} status={} durationMs={}", request.getMethod(),
                        request.getRequestURI(), response.getStatus(), (System.nanoTime() - start) / 1_000_000);
            }
        }
    }
}
