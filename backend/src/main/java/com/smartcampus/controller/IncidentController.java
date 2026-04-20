package com.smartcampus.controller;

import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.smartcampus.dto.IncidentCommentCreateRequest;
import com.smartcampus.dto.IncidentCommentUpdateRequest;
import com.smartcampus.dto.IncidentCreateRequest;
import com.smartcampus.dto.IncidentUpdateRequest;
import com.smartcampus.model.Incident;
import com.smartcampus.model.IncidentComment;
import com.smartcampus.service.IncidentService;
import com.smartcampus.service.IncidentService.CommentActor;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    private final IncidentService incidentService;

    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Incident createIncident(Authentication authentication, @Valid @RequestBody IncidentCreateRequest request) {
        String email = extractEmail(authentication);
        if (email == null) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return incidentService.createIncident(email, request);
    }

    @GetMapping
    public List<Incident> listIncidents() {
        return incidentService.listAll();
    }

    @GetMapping("/user")
    public List<Incident> listUserIncidents(Authentication authentication) {
        String email = extractEmail(authentication);
        if (email == null) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return incidentService.listForUser(email);
    }

    @PutMapping("/{id}")
    public Incident updateIncident(Authentication authentication,
                                   @PathVariable("id") String ticketId,
                                   @Valid @RequestBody IncidentUpdateRequest request) {
        String email = extractEmail(authentication);
        if (email == null) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return incidentService.updateIncident(ticketId, email, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteIncident(Authentication authentication, @PathVariable("id") String ticketId) {
        String email = extractEmail(authentication);
        if (email == null) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        incidentService.deleteIncident(ticketId, email);
    }

    @GetMapping("/{id}/comments")
    public List<IncidentComment> listComments(Authentication authentication,
                                              @PathVariable("id") String ticketId) {
        CommentActor actor = extractActor(authentication);
        return incidentService.listComments(ticketId, actor);
    }

    @PostMapping("/{id}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public List<IncidentComment> addComment(Authentication authentication,
                                            @PathVariable("id") String ticketId,
                                            @Valid @RequestBody IncidentCommentCreateRequest request) {
        CommentActor actor = extractActor(authentication);
        return incidentService.addComment(ticketId, actor, request.getBody());
    }

    @PutMapping("/{id}/comments/{commentId}")
    public List<IncidentComment> updateComment(Authentication authentication,
                                               @PathVariable("id") String ticketId,
                                               @PathVariable("commentId") String commentId,
                                               @Valid @RequestBody IncidentCommentUpdateRequest request) {
        CommentActor actor = extractActor(authentication);
        return incidentService.updateComment(ticketId, commentId, actor, request.getBody());
    }

    @DeleteMapping("/{id}/comments/{commentId}")
    public List<IncidentComment> deleteComment(Authentication authentication,
                                               @PathVariable("id") String ticketId,
                                               @PathVariable("commentId") String commentId) {
        CommentActor actor = extractActor(authentication);
        return incidentService.deleteComment(ticketId, commentId, actor);
    }

    private String extractEmail(Authentication authentication) {
        if (authentication == null) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof OAuth2User oauth2User) {
            Object email = oauth2User.getAttribute("email");
            if (email != null) {
                return normalizeEmail(String.valueOf(email));
            }
        }
        return normalizeEmail(authentication.getName());
    }

    private CommentActor extractActor(Authentication authentication) {
        String email = extractEmail(authentication);
        if (email == null) {
            return null;
        }

        String name = null;
        if (authentication != null && authentication.getPrincipal() instanceof OAuth2User oauth2User) {
            Object nameAttr = oauth2User.getAttribute("name");
            if (nameAttr != null) {
                name = String.valueOf(nameAttr);
            }
        }
        if (name == null || name.isBlank()) {
            name = email;
        }

        boolean isAdmin = hasRole(authentication, "ROLE_ADMIN");
        boolean isTechnician = hasRole(authentication, "ROLE_TECHNICIAN");
        String role = isAdmin ? "ADMIN" : (isTechnician ? "TECHNICIAN" : "USER");

        return new CommentActor(email, name, role, isAdmin, isTechnician);
    }

    private boolean hasRole(Authentication authentication, String role) {
        if (authentication == null || role == null) {
            return false;
        }

        for (GrantedAuthority authority : authentication.getAuthorities()) {
            if (role.equals(authority.getAuthority())) {
                return true;
            }
        }
        return false;
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }
        String trimmed = email.trim();
        return trimmed.isBlank() ? null : trimmed.toLowerCase(Locale.ROOT);
    }
}
