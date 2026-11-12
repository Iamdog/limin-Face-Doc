package com.example.workshop;

import java.io.IOException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.*;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.AuthenticationEntryPoint;

@Configuration
public class SecurityConfig {
    @Bean
    PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean
    UserDetailsService users(PasswordEncoder encoder) {
        return new InMemoryUserDetailsManager(
            User.withUsername("alice").password(encoder.encode("alice-demo")).roles("EDITOR").build(),
            User.withUsername("bob").password(encoder.encode("bob-demo")).roles("EDITOR").build(),
            User.withUsername("viewer").password(encoder.encode("viewer-demo")).roles("VIEWER").build());
    }

    @Bean
    SecurityFilterChain security(HttpSecurity http, ObjectMapper json) throws Exception {
        AuthenticationEntryPoint unauthenticated = (request, response, error) -> {
            response.setHeader("WWW-Authenticate", "Basic realm=workshop");
            writeError(json, request, response, 401, "UNAUTHENTICATED", "请提供有效登录凭证");
        };
        http.authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.GET, "/api/csrf", "/api/tasks", "/api/tasks/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/tasks").hasRole("EDITOR")
                .requestMatchers(HttpMethod.PUT, "/api/tasks/*").hasRole("EDITOR")
                .anyRequest().denyAll())
            .httpBasic(basic -> basic.authenticationEntryPoint(unauthenticated))
            .csrf(Customizer.withDefaults())
            .exceptionHandling(errors -> errors
                .authenticationEntryPoint(unauthenticated)
                .accessDeniedHandler((request, response, error) ->
                    writeError(json, request, response, 403, "FORBIDDEN", "缺少权限或 CSRF 校验未通过")));
        return http.build();
    }

    private static void writeError(ObjectMapper json, HttpServletRequest request, HttpServletResponse response,
                                    int status, String code, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        json.writeValue(response.getOutputStream(), ApiError.of(request, code, message));
    }
}
