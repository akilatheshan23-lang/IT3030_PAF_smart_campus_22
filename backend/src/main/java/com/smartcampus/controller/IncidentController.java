package com.smartcampus.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.smartcampus.dto.IncidentCreateRequest;
import com.smartcampus.model.Incident;
import com.smartcampus.service.IncidentService;

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

    private String extractEmail(Authentication authentication) {
        if (authentication == null) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof OAuth2User oauth2User) {
            Object email = oauth2User.getAttribute("email");
            if (email != null) {
                return String.valueOf(email);
            }
        }
        return authentication.getName();
    }
}
