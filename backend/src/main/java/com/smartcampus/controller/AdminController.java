package com.smartcampus.controller;

import com.smartcampus.dto.BookingStatusUpdateRequest;
import com.smartcampus.dto.TicketAssignmentRequest;
import com.smartcampus.dto.TicketRejectionRequest;
import com.smartcampus.model.Booking;
import com.smartcampus.model.BookingStatus;
import com.smartcampus.model.Incident;
import com.smartcampus.model.UserAccount;
import com.smartcampus.model.UserRole;
import com.smartcampus.repository.UserAccountRepository;
import com.smartcampus.service.CampusService;
import com.smartcampus.service.IncidentService;
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
    private final IncidentService incidentService;
    private final UserAccountRepository userAccountRepository;

    public AdminController(CampusService campusService,
                           IncidentService incidentService,
                           UserAccountRepository userAccountRepository) {
        this.campusService = campusService;
        this.incidentService = incidentService;
        this.userAccountRepository = userAccountRepository;
    }

    @GetMapping("/dashboard/summary")
    public Map<String, Object> getSummary() {
        return campusService.getAdminSummary();
    }

    @GetMapping("/dashboard/utilization-heatmap")
    public List<Map<String, Object>> getUtilizationHeatmap() {
        return campusService.getDepartmentUtilizationHeatmap();
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
    @GetMapping("/tickets")
    public List<Incident> getTickets() {
        return incidentService.listAll();
    }

    @GetMapping("/technicians")
    public List<UserAccount> getTechnicians() {
        return userAccountRepository.findAll().stream()
                .filter(u -> u.getRole() == UserRole.ROLE_TECHNICIAN)
                .toList();
    }

    @PutMapping("/tickets/{id}/assign")
    public Incident assignTicket(@PathVariable String id,
                                 @Valid @RequestBody TicketAssignmentRequest request) {
        UserAccount technician = userAccountRepository.findById(request.getTechnicianId())
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Technician not found."));

        return incidentService.assignTechnician(id, technician);
    }

    @PutMapping("/tickets/{id}/reject")
    public Incident rejectTicket(@PathVariable String id, @Valid @RequestBody TicketRejectionRequest request) {
        return incidentService.rejectTicket(id, request.getReason());
    }

    @PutMapping("/tickets/{id}/close")
    public Incident closeTicket(@PathVariable String id) {
        return incidentService.closeTicket(id);
    }
}
