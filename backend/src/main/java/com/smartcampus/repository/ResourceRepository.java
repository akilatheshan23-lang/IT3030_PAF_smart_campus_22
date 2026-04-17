package com.smartcampus.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.smartcampus.model.Resource;

public interface ResourceRepository extends MongoRepository<Resource, String> {
	boolean existsByNameIgnoreCaseAndTypeIgnoreCaseAndLocationIgnoreCase(String name, String type, String location);

	Optional<Resource> findByNameIgnoreCaseAndTypeIgnoreCaseAndLocationIgnoreCase(String name, String type, String location);
}
