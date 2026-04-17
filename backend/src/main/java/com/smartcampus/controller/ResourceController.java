package com.smartcampus.controller;

import com.smartcampus.dto.ResourceCreateRequest;
import com.smartcampus.model.Resource;
import com.smartcampus.service.CampusService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/resources")
public class ResourceController {

    private final CampusService campusService;

    public ResourceController(CampusService campusService) {
        this.campusService = campusService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Resource createResource(@Valid @RequestBody ResourceCreateRequest request) {
        return campusService.createResource(request);
    }
}