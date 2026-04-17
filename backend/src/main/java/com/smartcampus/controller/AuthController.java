package com.smartcampus.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @GetMapping("/google/user")
    public void startUserGoogleLogin(HttpServletRequest request, HttpServletResponse response) throws IOException {
        var existingSession = request.getSession(false);
        if (existingSession != null) {
            existingSession.invalidate();
        }
        response.sendRedirect("/oauth2/authorization/google-user");
    }

    @GetMapping("/google/technician")
    public void startTechnicianGoogleLogin(HttpServletRequest request, HttpServletResponse response) throws IOException {
        var existingSession = request.getSession(false);
        if (existingSession != null) {
            existingSession.invalidate();
        }
        response.sendRedirect("/oauth2/authorization/google-technician");
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(Authentication authentication) {
        if (authentication == null
            || !authentication.isAuthenticated()
            || authentication instanceof AnonymousAuthenticationToken) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String email = null;
        String name = null;
        String picture = null;
        String role = resolveRole(authentication.getAuthorities());

        if (authentication instanceof OAuth2AuthenticationToken token) {
            OAuth2User user = token.getPrincipal();
            email = user.getAttribute("email");
            name = user.getAttribute("name");
            picture = user.getAttribute("picture");
        } else {
            email = authentication.getName();
            name = "Admin";
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("email", email);
        payload.put("name", name != null ? name : email);
        payload.put("picture", picture);
        payload.put("role", role);

        return ResponseEntity.ok(payload);
    }

    private String resolveRole(Iterable<? extends GrantedAuthority> authorities) {
        for (GrantedAuthority authority : authorities) {
            if ("ROLE_ADMIN".equals(authority.getAuthority())) {
                return "ADMIN";
            }
        }

        for (GrantedAuthority authority : authorities) {
            if ("ROLE_TECHNICIAN".equals(authority.getAuthority())) {
                return "TECHNICIAN";
            }
        }

        return "USER";
    }
}
