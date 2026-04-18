package com.smartcampus.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.smartcampus.dto.ResourceCreateRequest;
import com.smartcampus.dto.ResourceUpdateRequest;
import com.smartcampus.model.Resource;
import com.smartcampus.model.ResourceStatus;
import com.smartcampus.service.CampusService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/resources")
public class ResourceController {

    private final CampusService campusService;

    public ResourceController(CampusService campusService) {
        this.campusService = campusService;
    }

    @GetMapping
    public List<Resource> getResources(
            @RequestParam(required = false) ResourceStatus status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) String name
    ) {
        return campusService.getAdminResources(status, type, location, minCapacity, name);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Resource createResource(@Valid @RequestBody ResourceCreateRequest request) {
        return campusService.createResource(request);
    }

    @PutMapping("/{id}")
    public Resource updateResource(@PathVariable String id, @Valid @RequestBody ResourceCreateRequest request) {
        return campusService.updateResource(id, request);
    }

    @PatchMapping("/{id}")
    public Resource patchResource(@PathVariable String id, @Valid @RequestBody ResourceUpdateRequest request) {
        return campusService.patchResource(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteResource(@PathVariable String id) {
        campusService.deleteResource(id);
    }
}
