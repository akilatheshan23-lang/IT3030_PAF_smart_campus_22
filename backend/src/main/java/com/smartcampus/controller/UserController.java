package com.smartcampus.controller;

import com.smartcampus.dto.BookingRequest;
import com.smartcampus.model.Booking;
import com.smartcampus.service.CampusService;
import jakarta.validation.Valid;
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
    public Booking createBooking(@Valid @RequestBody BookingRequest request) {
        return campusService.createBooking(request);
    }

    @GetMapping("/bookings")
    public List<Booking> getUserBookings(@RequestParam String email) {
        return campusService.getUserBookings(email);
    }

    @PutMapping("/bookings/{id}/cancel")
    public Booking cancelUserBooking(@PathVariable String id, @RequestParam String email) {
        return campusService.cancelUserBooking(id, email);
    }
}