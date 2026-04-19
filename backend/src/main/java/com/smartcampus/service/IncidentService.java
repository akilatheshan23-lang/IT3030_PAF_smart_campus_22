package com.smartcampus.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.smartcampus.dto.IncidentCreateRequest;
import com.smartcampus.dto.IncidentUpdateRequest;
import com.smartcampus.model.Incident;
import com.smartcampus.model.IncidentComment;
import com.smartcampus.model.IncidentStatus;
import com.smartcampus.model.Priority;
import com.smartcampus.model.UserAccount;
import com.smartcampus.repository.IncidentRepository;

@Service
public class IncidentService {

    private static final int MAX_ATTACHMENTS = 3;
    private static final int MAX_ATTACHMENT_BYTES = 1_500_000;
    private static final Set<String> ALLOWED_IMAGE_MIME_TYPES = Set.of(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/gif"
    );
        private static final int MAX_COMMENT_LENGTH = 1000;

    private final IncidentRepository incidentRepository;
    private final com.smartcampus.repository.BookingRepository bookingRepository;

    public IncidentService(IncidentRepository incidentRepository, com.smartcampus.repository.BookingRepository bookingRepository) {
        this.incidentRepository = incidentRepository;
        this.bookingRepository = bookingRepository;
    }

    public static final class CommentActor {
        private final String email;
        private final String name;
        private final String role;
        private final boolean admin;
        private final boolean technician;

        public CommentActor(String email, String name, String role, boolean admin, boolean technician) {
            this.email = email;
            this.name = name;
            this.role = role;
            this.admin = admin;
            this.technician = technician;
        }

        public String getEmail() {
            return email;
        }

        public String getName() {
            return name;
        }

        public String getRole() {
            return role;
        }

        public boolean isAdmin() {
            return admin;
        }

        public boolean isTechnician() {
            return technician;
        }
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
        List<String> attachments = sanitizeAttachments(request.getAttachments());

        Incident incident = new Incident();
        incident.setResourceId(resourceId);
        incident.setCategory(category);
        incident.setDescription(description);
        incident.setAttachments(attachments);
        incident.setPriority(priority);
        incident.setStatus(IncidentStatus.OPEN);
        incident.setCreatedAt(Instant.now().toString());
        incident.setRequesterEmail(normalizedEmail);

        return incidentRepository.save(incident);
    }

    public List<Incident> listAll() {
        return incidentRepository.findAll();
    }

    public List<Incident> listForTechnician(String technicianId) {
        if (technicianId == null || technicianId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return incidentRepository.findByAssignedTechnicianIdOrderByCreatedAtDesc(technicianId);
    }

    public Incident assignTechnician(String ticketId, UserAccount technician) {
        Incident incident = incidentRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found."));

        if (incident.getStatus() == IncidentStatus.RESOLVED
                || incident.getStatus() == IncidentStatus.CLOSED
                || incident.getStatus() == IncidentStatus.REJECTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot assign a closed, resolved, or rejected ticket.");
        }

        incident.setAssignedTechnicianId(technician.getId());
        incident.setAssignedTechnicianName(technician.getName());
        incident.setAssignedTechnicianEmail(technician.getEmail());
        incident.setAssignedAt(Instant.now().toString());
        incident.setStatus(IncidentStatus.IN_PROGRESS);

        return incidentRepository.save(incident);
    }

    public Incident resolveTicket(String ticketId, UserAccount technician) {
        Incident incident = incidentRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found."));

        if (incident.getAssignedTechnicianId() == null
                || !incident.getAssignedTechnicianId().equals(technician.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only resolve tickets assigned to you.");
        }

        if (incident.getStatus() != IncidentStatus.IN_PROGRESS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only in-progress tickets can be resolved.");
        }

        incident.setStatus(IncidentStatus.RESOLVED);
        incident.setResolvedAt(Instant.now().toString());
        return incidentRepository.save(incident);
    }

    public Incident closeTicket(String ticketId) {
        Incident incident = incidentRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found."));

        if (incident.getStatus() != IncidentStatus.RESOLVED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only resolved tickets can be closed.");
        }

        incident.setStatus(IncidentStatus.CLOSED);
        incident.setClosedAt(Instant.now().toString());
        return incidentRepository.save(incident);
    }

    public Incident rejectTicket(String ticketId, String reason) {
        Incident incident = incidentRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found."));

        if (incident.getStatus() == IncidentStatus.RESOLVED || incident.getStatus() == IncidentStatus.CLOSED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resolved or closed tickets cannot be rejected.");
        }

        String trimmedReason = normalize(reason);
        if (trimmedReason == null || trimmedReason.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rejection reason is required.");
        }

        incident.setStatus(IncidentStatus.REJECTED);
        incident.setRejectionReason(trimmedReason);
        return incidentRepository.save(incident);
    }

    public List<Incident> listForUser(String requesterEmail) {
        // find all incidents created by this requester; fall back to legacy tickets with null requester
        String normalizedEmail = normalizeEmail(requesterEmail);
        if (normalizedEmail == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        List<Incident> owned = incidentRepository.findByRequesterEmailIgnoreCaseOrderByCreatedAtDesc(normalizedEmail);

        var resourceIds = bookingRepository.findByRequesterEmailIgnoreCaseOrderByBookingDateDesc(normalizedEmail)
                .stream()
                .map(b -> b.getResourceId())
                .filter(rid -> rid != null)
                .collect(Collectors.toSet());

        List<Incident> legacy = incidentRepository.findAll().stream()
                .filter(i -> i.getRequesterEmail() == null)
                .filter(i -> i.getResourceId() != null && resourceIds.contains(i.getResourceId()))
                .toList();

        List<Incident> combined = new ArrayList<>();
        combined.addAll(owned);
        combined.addAll(legacy);
        return combined;
    }

    public Incident updateIncident(String ticketId, String requesterEmail, IncidentUpdateRequest request) {
        Incident incident = incidentRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found."));

        String normalizedEmail = normalizeEmail(requesterEmail);
        if (normalizedEmail == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        enforceOwnership(incident, normalizedEmail);

        if (request.getCategory() != null) {
            String category = normalize(request.getCategory());
            if (category == null || category.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category cannot be blank.");
            }
            incident.setCategory(category);
        }

        if (request.getDescription() != null) {
            String description = normalize(request.getDescription());
            if (description == null || description.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Description cannot be blank.");
            }
            incident.setDescription(description);
        }

        if (request.getPriority() != null) {
            incident.setPriority(request.getPriority());
        }

        if (request.getAttachments() != null) {
            List<String> attachments = sanitizeAttachments(request.getAttachments());
            incident.setAttachments(attachments);
        }

        return incidentRepository.save(incident);
    }

    public void deleteIncident(String ticketId, String requesterEmail) {
        Incident incident = incidentRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found."));

        String normalizedEmail = normalizeEmail(requesterEmail);
        if (normalizedEmail == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        enforceOwnership(incident, normalizedEmail);
        incidentRepository.deleteById(ticketId);
    }

    public List<IncidentComment> listComments(String ticketId, CommentActor actor) {
        Incident incident = incidentRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found."));

        authorizeCommentAccess(incident, actor);
        return List.copyOf(getOrCreateComments(incident));
    }

    public List<IncidentComment> addComment(String ticketId, CommentActor actor, String body) {
        Incident incident = incidentRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found."));

        authorizeCommentAccess(incident, actor);

        String normalizedBody = normalize(body);
        if (normalizedBody == null || normalizedBody.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment cannot be blank.");
        }
        if (normalizedBody.length() > MAX_COMMENT_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment must be 1000 characters or less.");
        }

        IncidentComment comment = new IncidentComment();
        comment.setId(UUID.randomUUID().toString());
        comment.setAuthorEmail(actor.getEmail());
        comment.setAuthorName(actor.getName() != null ? actor.getName() : actor.getEmail());
        comment.setAuthorRole(actor.getRole());
        comment.setBody(normalizedBody);
        comment.setCreatedAt(Instant.now().toString());

        List<IncidentComment> comments = getOrCreateComments(incident);
        comments.add(comment);
        incident.setComments(comments);
        Incident saved = incidentRepository.save(incident);
        return List.copyOf(getOrCreateComments(saved));
    }

    public List<IncidentComment> updateComment(String ticketId, String commentId, CommentActor actor, String body) {
        Incident incident = incidentRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found."));

        authorizeCommentAccess(incident, actor);
        IncidentComment comment = findComment(incident, commentId);
        enforceCommentOwnership(comment, actor);

        String normalizedBody = normalize(body);
        if (normalizedBody == null || normalizedBody.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment cannot be blank.");
        }
        if (normalizedBody.length() > MAX_COMMENT_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment must be 1000 characters or less.");
        }

        comment.setBody(normalizedBody);
        comment.setUpdatedAt(Instant.now().toString());

        Incident saved = incidentRepository.save(incident);
        return List.copyOf(getOrCreateComments(saved));
    }

    public List<IncidentComment> deleteComment(String ticketId, String commentId, CommentActor actor) {
        Incident incident = incidentRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found."));

        authorizeCommentAccess(incident, actor);
        IncidentComment comment = findComment(incident, commentId);
        enforceCommentDelete(comment, actor);

        List<IncidentComment> comments = getOrCreateComments(incident);
        comments.removeIf(existing -> commentId.equals(existing.getId()));
        incident.setComments(comments);
        Incident saved = incidentRepository.save(incident);
        return List.copyOf(getOrCreateComments(saved));
    }

    private void enforceOwnership(Incident incident, String normalizedEmail) {
        String owner = normalizeEmail(incident.getRequesterEmail());
        if (owner != null) {
            if (!owner.equals(normalizedEmail)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only modify your own tickets.");
            }
            return;
        }

        boolean hasBooking = bookingRepository.findByRequesterEmailIgnoreCaseOrderByBookingDateDesc(normalizedEmail)
                .stream()
                .map(b -> b.getResourceId())
                .filter(rid -> rid != null)
                .collect(Collectors.toSet())
                .contains(incident.getResourceId());

        if (!hasBooking) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only modify your own tickets.");
        }
    }

    private void authorizeCommentAccess(Incident incident, CommentActor actor) {
        if (actor == null || actor.getEmail() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        if (actor.isAdmin()) {
            return;
        }

        if (actor.isTechnician()) {
            String assignedEmail = normalizeEmail(incident.getAssignedTechnicianEmail());
            if (assignedEmail == null || !assignedEmail.equals(actor.getEmail())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only comment on tickets assigned to you.");
            }
            return;
        }

        enforceOwnership(incident, actor.getEmail());
    }

    private void enforceCommentOwnership(IncidentComment comment, CommentActor actor) {
        String owner = normalizeEmail(comment.getAuthorEmail());
        if (owner == null || !owner.equals(actor.getEmail())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only edit your own comments.");
        }
    }

    private void enforceCommentDelete(IncidentComment comment, CommentActor actor) {
        if (actor.isAdmin()) {
            return;
        }

        String owner = normalizeEmail(comment.getAuthorEmail());
        if (owner == null || !owner.equals(actor.getEmail())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own comments.");
        }
    }

    private IncidentComment findComment(Incident incident, String commentId) {
        if (commentId == null || commentId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment ID is required.");
        }

        List<IncidentComment> comments = getOrCreateComments(incident);
        return comments.stream()
                .filter(comment -> commentId.equals(comment.getId()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found."));
    }

    private List<IncidentComment> getOrCreateComments(Incident incident) {
        List<IncidentComment> comments = incident.getComments();
        if (comments == null) {
            comments = new ArrayList<>();
            incident.setComments(comments);
        }
        return comments;
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

    private List<String> sanitizeAttachments(List<String> attachments) {
        if (attachments == null || attachments.isEmpty()) {
            return List.of();
        }

        if (attachments.size() > MAX_ATTACHMENTS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Up to 3 attachments are allowed.");
        }

        List<String> cleaned = new ArrayList<>();
        for (String attachment : attachments) {
            if (attachment == null || attachment.trim().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attachment cannot be blank.");
            }

            String trimmed = attachment.trim();
            int commaIndex = trimmed.indexOf(',');
            if (!trimmed.startsWith("data:image/") || commaIndex < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attachments must be image data URLs.");
            }

            String header = trimmed.substring(0, commaIndex);
            if (!header.contains(";base64")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attachments must be base64 encoded.");
            }

            int mimeEnd = header.indexOf(';');
            String mime = header.substring("data:".length(), mimeEnd).toLowerCase(Locale.ROOT);
            if (!ALLOWED_IMAGE_MIME_TYPES.contains(mime)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported attachment type.");
            }

            String payload = trimmed.substring(commaIndex + 1);
            byte[] decoded;
            try {
                decoded = Base64.getDecoder().decode(payload);
            } catch (IllegalArgumentException ex) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid attachment encoding.");
            }

            if (decoded.length > MAX_ATTACHMENT_BYTES) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Each attachment must be 1.5MB or smaller.");
            }

            cleaned.add(trimmed);
        }

        return cleaned;
    }
}
