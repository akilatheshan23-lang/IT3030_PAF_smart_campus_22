package com.smartcampus.controller;

import com.smartcampus.model.Resource;
import com.smartcampus.service.CampusService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HomeController {

    private final CampusService campusService;

    public HomeController(CampusService campusService) {
        this.campusService = campusService;
    }

    @GetMapping("/home/overview")
    public Map<String, Object> getOverview() {
        return campusService.getHomeOverview();
    }

    @GetMapping("/resources/public")
    public List<Resource> getResources(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Integer minCapacity
    ) {
        return campusService.getPublicResources(type, location, minCapacity);
    }
}
