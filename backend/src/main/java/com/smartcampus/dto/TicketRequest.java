package com.smartcampus.dto;

import com.smartcampus.model.TicketPriority;

public class TicketRequest {
    private String resourceId;
    private String location;
    private String category;
    private String description;
    private TicketPriority priority;

    public TicketRequest() {}

    public String getResourceId() { return resourceId; }
    public void setResourceId(String resourceId) { this.resourceId = resourceId; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public TicketPriority getPriority() { return priority; }
    public void setPriority(TicketPriority priority) { this.priority = priority; }
}
