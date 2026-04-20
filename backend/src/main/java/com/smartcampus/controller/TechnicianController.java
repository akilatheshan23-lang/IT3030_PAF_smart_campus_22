package com.smartcampus.controller;

import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.smartcampus.model.Incident;
import com.smartcampus.model.UserAccount;
import com.smartcampus.repository.UserAccountRepository;
import com.smartcampus.service.IncidentService;

@RestController
@RequestMapping("/api/technician")
public class TechnicianController {

    private final IncidentService incidentService;
    private final UserAccountRepository userAccountRepository;

    public TechnicianController(IncidentService incidentService,
                                UserAccountRepository userAccountRepository) {
        this.incidentService = incidentService;
        this.userAccountRepository = userAccountRepository;
    }

    @GetMapping("/tickets")
    public List<Incident> getAssignedTickets(Authentication authentication) {
        String email = extractEmail(authentication);
        if (email == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        UserAccount technician = userAccountRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Technician not found."));

        return incidentService.listForTechnician(technician.getId());
    }

    @PutMapping("/tickets/{id}/resolve")
    public Incident resolveTicket(@PathVariable("id") String ticketId, Authentication authentication) {
        String email = extractEmail(authentication);
        if (email == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        UserAccount technician = userAccountRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Technician not found."));

        return incidentService.resolveTicket(ticketId, technician);
    }

    private String extractEmail(Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof OAuth2User oauth2User) {
            Object email = oauth2User.getAttribute("email");
            if (email != null) {
                return normalizeEmail(String.valueOf(email));
            }
            Object preferred = oauth2User.getAttribute("preferred_username");
            if (preferred != null) {
                return normalizeEmail(String.valueOf(preferred));
            }
        }
        String name = authentication.getName();
        if (name == null || name.isBlank() || "anonymousUser".equalsIgnoreCase(name)) {
            return null;
        }
        return normalizeEmail(name);
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }
        String trimmed = email.trim();
        return trimmed.isBlank() ? null : trimmed.toLowerCase(Locale.ROOT);
    }
}
