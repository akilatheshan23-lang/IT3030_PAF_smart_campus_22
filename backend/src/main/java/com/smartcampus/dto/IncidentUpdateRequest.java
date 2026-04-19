package com.smartcampus.dto;

import java.util.List;

import com.smartcampus.model.Priority;

import jakarta.validation.constraints.Size;

public class IncidentUpdateRequest {

    private String category;
    private String description;
    private Priority priority;

    @Size(max = 3, message = "Up to 3 attachments are allowed.")
    private List<String> attachments;

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Priority getPriority() {
        return priority;
    }

    public void setPriority(Priority priority) {
        this.priority = priority;
    }

    public List<String> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<String> attachments) {
        this.attachments = attachments;
    }
}
