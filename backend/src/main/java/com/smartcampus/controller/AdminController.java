package com.smartcampus.controller;

import com.smartcampus.dto.BookingStatusUpdateRequest;
import com.smartcampus.model.Booking;
import com.smartcampus.model.BookingStatus;
import com.smartcampus.service.CampusService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final CampusService campusService;

    public AdminController(CampusService campusService) {
        this.campusService = campusService;
    }

    @GetMapping("/dashboard/summary")
    public Map<String, Object> getSummary() {
        return campusService.getAdminSummary();
    }

    @GetMapping("/bookings")
    public List<Booking> getBookings(
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) String resource,
            @RequestParam(required = false) String date
    ) {
        return campusService.getAdminBookings(status, resource, date);
    }

    @PutMapping("/bookings/{id}/status")
    public Booking updateStatus(@PathVariable String id, @Valid @RequestBody BookingStatusUpdateRequest request) {
        return campusService.updateBookingStatus(id, request);
    }
}
