package com.smartcampus.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "tickets")
public class IncidentTicket {

    @Id
    private String id;
    
    private String ticketCode;
    private String resourceId;
    private String location;
    private String category;
    private String description;
    
    private TicketPriority priority;
    private TicketStatus status;
    
    private String reporterEmail;
    private String reporterName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public IncidentTicket() {
    }

    public IncidentTicket(String ticketCode, String resourceId, String location, String category, String description, TicketPriority priority, TicketStatus status, String reporterEmail, String reporterName) {
        this.ticketCode = ticketCode;
        this.resourceId = resourceId;
        this.location = location;
        this.category = category;
        this.description = description;
        this.priority = priority;
        this.status = status;
        this.reporterEmail = reporterEmail;
        this.reporterName = reporterName;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTicketCode() { return ticketCode; }
    public void setTicketCode(String ticketCode) { this.ticketCode = ticketCode; }
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
    public TicketStatus getStatus() { return status; }
    public void setStatus(TicketStatus status) { this.status = status; }
    public String getReporterEmail() { return reporterEmail; }
    public void setReporterEmail(String reporterEmail) { this.reporterEmail = reporterEmail; }
    public String getReporterName() { return reporterName; }
    public void setReporterName(String reporterName) { this.reporterName = reporterName; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
