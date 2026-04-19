package com.smartcampus.dto;

import jakarta.validation.constraints.NotBlank;

public class TicketRejectionRequest {

    @NotBlank(message = "Rejection reason is required.")
    private String reason;

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
