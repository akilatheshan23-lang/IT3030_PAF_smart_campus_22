package com.smartcampus.controller;

import com.smartcampus.dto.TicketRequest;
import com.smartcampus.model.IncidentTicket;
import com.smartcampus.model.TicketStatus;
import com.smartcampus.service.TicketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "${app.frontend.base-url:http://localhost:5173}", allowCredentials = "true")
public class TicketController {

    private final TicketService ticketService;

    @Autowired
    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PostMapping("/user/tickets")
    public ResponseEntity<IncidentTicket> createTicket(
            @RequestBody TicketRequest request,
            @AuthenticationPrincipal OAuth2User principal) {
        
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }

        String email = principal.getAttribute("email");
        String name = principal.getAttribute("name");
        
        IncidentTicket createdTicket = ticketService.createTicket(request, email, name);
        return ResponseEntity.ok(createdTicket);
    }

    @GetMapping("/user/tickets")
    public ResponseEntity<List<IncidentTicket>> getUserTickets(
            @AuthenticationPrincipal OAuth2User principal) {
        
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }

        String email = principal.getAttribute("email");
        List<IncidentTicket> tickets = ticketService.getUserTickets(email);
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/technician/all-tickets")
    public ResponseEntity<List<IncidentTicket>> getAllTickets() {
        // Technically this should be protected by HasRole("TECHNICIAN") or "ADMIN",
        // but we rely on the main config for path protections.
        List<IncidentTicket> tickets = ticketService.getAllTickets();
        return ResponseEntity.ok(tickets);
    }

    @PutMapping("/technician/tickets/{id}/status")
    public ResponseEntity<IncidentTicket> updateTicketStatus(
            @PathVariable String id,
            @RequestParam TicketStatus status) {
        
        IncidentTicket updatedTicket = ticketService.updateTicketStatus(id, status);
        return ResponseEntity.ok(updatedTicket);
    }
}
