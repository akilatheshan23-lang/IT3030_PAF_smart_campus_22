package com.smartcampus.service;

import com.smartcampus.dto.TicketRequest;
import com.smartcampus.model.IncidentTicket;
import com.smartcampus.model.NotificationCategory;
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
    private final NotificationService notificationService;

    @Autowired
    public TicketService(IncidentTicketRepository ticketRepository,
                         NotificationService notificationService) {
        this.ticketRepository = ticketRepository;
        this.notificationService = notificationService;
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
        
        IncidentTicket saved = ticketRepository.save(ticket);
        String label = saved.getTicketCode() != null ? saved.getTicketCode() : saved.getId();
        notificationService.createAdminNotification(
            NotificationCategory.TICKET_STATUS,
            "New maintenance ticket",
            "New maintenance ticket " + label + " submitted.",
            "MAINTENANCE_TICKET",
            saved.getId()
        );
        return saved;
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
        
        IncidentTicket saved = ticketRepository.save(ticket);
        notifyTicketStatusChange(saved);
        return saved;
    }

    private void notifyTicketStatusChange(IncidentTicket ticket) {
        if (ticket == null || ticket.getStatus() == null) {
            return;
        }

        String email = ticket.getReporterEmail();
        if (email == null || email.isBlank()) {
            return;
        }

        String ticketCode = ticket.getTicketCode() != null ? ticket.getTicketCode() : ticket.getId();
        String statusLabel = ticket.getStatus().name().toLowerCase().replace('_', ' ');
        statusLabel = statusLabel.substring(0, 1).toUpperCase() + statusLabel.substring(1);

        notificationService.createNotification(
                email,
                NotificationCategory.TICKET_STATUS,
                "Ticket status updated",
                "Your maintenance ticket " + ticketCode + " is now " + statusLabel + ".",
                "MAINTENANCE_TICKET",
                ticket.getId()
        );
    }
}