package com.smartcampus.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.smartcampus.model.Resource;
import com.smartcampus.model.ResourceStatus;

public interface ResourceRepository extends MongoRepository<Resource, String> {
	boolean existsByNameIgnoreCaseAndTypeIgnoreCaseAndLocationIgnoreCaseAndDepartmentIgnoreCase(
			String name,
			String type,
			String location,
			String department
	);

	Optional<Resource> findByNameIgnoreCaseAndTypeIgnoreCaseAndLocationIgnoreCaseAndDepartmentIgnoreCase(
			String name,
			String type,
			String location,
			String department
	);

	long countByStatus(ResourceStatus status);
}
