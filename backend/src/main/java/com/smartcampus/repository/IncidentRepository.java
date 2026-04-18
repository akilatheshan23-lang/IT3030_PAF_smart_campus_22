package com.smartcampus.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.smartcampus.model.Incident;

public interface IncidentRepository extends MongoRepository<Incident, String> {

}
