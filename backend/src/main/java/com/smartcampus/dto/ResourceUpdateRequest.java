package com.smartcampus.dto;

import com.smartcampus.model.ResourceStatus;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public class ResourceUpdateRequest {

    @Size(max = 120, message = "Resource name must be at most 120 characters")
    private String name;

    @Size(max = 80, message = "Resource type must be at most 80 characters")
    private String type;

    @Positive(message = "Capacity must be positive")
    private Integer capacity;

    @Size(max = 120, message = "Location must be at most 120 characters")
    private String location;

    @Pattern(
            regexp = "^(Faculty of Computing|Engineering Department|Faculty of Business|Faculty of bussiness|Architecture Department)$",
            message = "Department must be one of the supported options"
    )
    private String department;

    @Pattern(regexp = "^\\d{2}:\\d{2}\\s-\\s\\d{2}:\\d{2}$", message = "Availability window must be in format HH:mm - HH:mm")
    private String availabilityWindow;

    private ResourceStatus status;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getAvailabilityWindow() {
        return availabilityWindow;
    }

    public void setAvailabilityWindow(String availabilityWindow) {
        this.availabilityWindow = availabilityWindow;
    }

    public ResourceStatus getStatus() {
        return status;
    }

    public void setStatus(ResourceStatus status) {
        this.status = status;
    }
}
