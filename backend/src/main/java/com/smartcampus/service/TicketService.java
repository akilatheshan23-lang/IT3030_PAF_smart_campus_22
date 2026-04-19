package com.smartcampus.service;

import com.smartcampus.dto.TicketRequest;
import com.smartcampus.model.IncidentTicket;
import com.smartcampus.model.TicketStatus;
import com.smartcampus.repository.IncidentTicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class TicketService {

    private final IncidentTicketRepository ticketRepository;

    @Autowired
    public TicketService(IncidentTicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

    public IncidentTicket createTicket(TicketRequest request, String email, String name) {
        String ticketCode = "TKT-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        
        IncidentTicket ticket = new IncidentTicket(
                ticketCode,
                request.getResourceId(),
                request.getLocation(),
                request.getCategory(),
                request.getDescription(),
                request.getPriority(),
                TicketStatus.OPEN,
                email,
                name
        );
        
        return ticketRepository.save(ticket);
    }

    public List<IncidentTicket> getUserTickets(String email) {
        return ticketRepository.findByReporterEmailOrderByCreatedAtDesc(email);
    }

    public List<IncidentTicket> getAllTickets() {
        return ticketRepository.findAllByOrderByCreatedAtDesc();
    }

    public IncidentTicket updateTicketStatus(String id, TicketStatus newStatus) {
        IncidentTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + id));
        ticket.setStatus(newStatus);
        ticket.setUpdatedAt(LocalDateTime.now());
        return ticketRepository.save(ticket);
    }
}
