package com.smartcampus.controller;

import com.smartcampus.dto.BookingRequest;
import com.smartcampus.model.Booking;
import com.smartcampus.service.CampusService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final CampusService campusService;

    public UserController(CampusService campusService) {
        this.campusService = campusService;
    }

    @PostMapping("/bookings")
    public Booking createBooking(Authentication authentication,
                                 @Valid @RequestBody BookingRequest request) {
        String email = extractEmail(authentication);
        if (email == null) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Authentication required");
        }
        String name = extractName(authentication, email);
        request.setRequesterEmail(email);
        request.setRequesterName(name);
        return campusService.createBooking(request);
    }

    @GetMapping("/bookings")
    public List<Booking> getUserBookings(Authentication authentication) {
        String email = extractEmail(authentication);
        if (email == null) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Authentication required");
        }
        return campusService.getUserBookings(email);
    }

    @PutMapping("/bookings/{id}/cancel")
    public Booking cancelUserBooking(@PathVariable String id,
                                     Authentication authentication,
                                     @RequestParam(required = false) String reason) {
        String email = extractEmail(authentication);
        if (email == null) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Authentication required");
        }
        return campusService.cancelUserBooking(id, email, reason);
    }

    private String extractEmail(Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof OAuth2User oauth2User) {
            Object email = oauth2User.getAttribute("email");
            if (email != null) {
                return String.valueOf(email);
            }
            Object preferred = oauth2User.getAttribute("preferred_username");
            if (preferred != null) {
                return String.valueOf(preferred);
            }
        }
        String name = authentication.getName();
        return (name == null || name.isBlank() || "anonymousUser".equalsIgnoreCase(name)) ? null : name;
    }

    private String extractName(Authentication authentication, String fallbackEmail) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return fallbackEmail;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof OAuth2User oauth2User) {
            Object name = oauth2User.getAttribute("name");
            if (name != null) {
                return String.valueOf(name);
            }
            Object preferred = oauth2User.getAttribute("preferred_username");
            if (preferred != null) {
                return String.valueOf(preferred);
            }
        }
        return fallbackEmail;
    }
}