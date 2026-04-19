package com.smartcampus.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.smartcampus.model.Incident;

public interface IncidentRepository extends MongoRepository<Incident, String> {

	List<Incident> findByAssignedTechnicianIdOrderByCreatedAtDesc(String assignedTechnicianId);

	List<Incident> findByRequesterEmailIgnoreCaseOrderByCreatedAtDesc(String requesterEmail);

}
