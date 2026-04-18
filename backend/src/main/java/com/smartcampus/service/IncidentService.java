package com.smartcampus.service;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.smartcampus.dto.IncidentCreateRequest;
import com.smartcampus.model.Incident;
import com.smartcampus.model.IncidentStatus;
import com.smartcampus.model.Priority;
import com.smartcampus.repository.IncidentRepository;

@Service
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final com.smartcampus.repository.BookingRepository bookingRepository;

    public IncidentService(IncidentRepository incidentRepository, com.smartcampus.repository.BookingRepository bookingRepository) {
        this.incidentRepository = incidentRepository;
        this.bookingRepository = bookingRepository;
    }

    public Incident createIncident(String requesterEmail, IncidentCreateRequest request) {
        String category = normalize(request.getCategory());
        String description = normalize(request.getDescription());

        if (category == null || category.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category is required.");
        }
        if (description == null || description.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Description is required.");
        }

        String resourceId = request.getResourceId();
        if (resourceId == null || resourceId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resource ID is required when reporting an incident.");
        }

        String normalizedEmail = normalizeEmail(requesterEmail);
        if (normalizedEmail == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        // Verify requester has a booking for this resource
        boolean hasBooking = bookingRepository.findByRequesterEmailIgnoreCaseOrderByBookingDateDesc(normalizedEmail)
                .stream()
                .map(b -> b.getResourceId())
                .filter(rid -> rid != null)
                .collect(Collectors.toSet())
                .contains(resourceId);

        if (!hasBooking) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only report incidents for resources you have booked.");
        }

        Priority priority = request.getPriority() != null ? request.getPriority() : Priority.MEDIUM;

        Incident incident = new Incident();
        incident.setResourceId(resourceId);
        incident.setCategory(category);
        incident.setDescription(description);
        incident.setPriority(priority);
        incident.setStatus(IncidentStatus.OPEN);
        incident.setCreatedAt(Instant.now().toString());

        return incidentRepository.save(incident);
    }

    public List<Incident> listAll() {
        return incidentRepository.findAll();
    }

    public List<Incident> listForUser(String requesterEmail) {
        // find all resourceIds user has booked
        String normalizedEmail = normalizeEmail(requesterEmail);
        if (normalizedEmail == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        var resourceIds = bookingRepository.findByRequesterEmailIgnoreCaseOrderByBookingDateDesc(normalizedEmail)
                .stream()
                .map(b -> b.getResourceId())
                .filter(rid -> rid != null)
                .collect(Collectors.toSet());

        return incidentRepository.findAll().stream()
                .filter(i -> i.getResourceId() != null && resourceIds.contains(i.getResourceId()))
                .toList();
    }

    private String normalize(String v) {
        return v == null ? null : v.trim().replaceAll("\\s+", " ");
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }
        String trimmed = email.trim();
        return trimmed.isBlank() ? null : trimmed.toLowerCase(Locale.ROOT);
    }
}
