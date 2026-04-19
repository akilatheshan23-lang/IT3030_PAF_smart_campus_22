package com.smartcampus.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class IncidentCommentCreateRequest {

    @NotBlank(message = "Comment is required")
    @Size(max = 1000, message = "Comment must be 1000 characters or less")
    private String body;

    public IncidentCommentCreateRequest() {
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }
}
