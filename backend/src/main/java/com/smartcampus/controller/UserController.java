package com.smartcampus.controller;

import com.smartcampus.dto.BookingRequest;
import com.smartcampus.model.Booking;
import com.smartcampus.service.CampusService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
    public Booking createBooking(@AuthenticationPrincipal OAuth2User principal,
                                 @Valid @RequestBody BookingRequest request) {
        String email = principal.getAttribute("email");
        String name = principal.getAttribute("name");
        request.setRequesterEmail(email);
        request.setRequesterName(name != null ? name : email);
        return campusService.createBooking(request);
    }

    @GetMapping("/bookings")
    public List<Booking> getUserBookings(@AuthenticationPrincipal OAuth2User principal) {
        String email = principal.getAttribute("email");
        return campusService.getUserBookings(email);
    }

    @PutMapping("/bookings/{id}/cancel")
    public Booking cancelUserBooking(@PathVariable String id,
                                     @AuthenticationPrincipal OAuth2User principal,
                                     @RequestParam(required = false) String reason) {
        String email = principal.getAttribute("email");
        return campusService.cancelUserBooking(id, email, reason);
    }
}