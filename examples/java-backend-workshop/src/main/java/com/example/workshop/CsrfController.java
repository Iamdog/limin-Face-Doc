package com.example.workshop;

import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

@RestController
public class CsrfController {
    public record TokenResponse(String headerName, String token) {}
    @GetMapping("/api/csrf")
    public TokenResponse csrf(CsrfToken token) {
        return new TokenResponse(token.getHeaderName(), token.getToken());
    }
}
