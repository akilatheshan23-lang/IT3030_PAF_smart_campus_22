package com.smartcampus.dto;

import jakarta.validation.constraints.NotBlank;

public class TicketAssignmentRequest {

    @NotBlank(message = "Technician ID is required")
    private String technicianId;

    public TicketAssignmentRequest() {
    }

    public String getTechnicianId() {
        return technicianId;
    }

    public void setTechnicianId(String technicianId) {
        this.technicianId = technicianId;
    }
}
