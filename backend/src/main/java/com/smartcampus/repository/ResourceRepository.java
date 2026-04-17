package com.smartcampus.repository;

import com.smartcampus.model.Resource;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ResourceRepository extends MongoRepository<Resource, String> {
	boolean existsByNameIgnoreCaseAndTypeIgnoreCaseAndLocationIgnoreCase(String name, String type, String location);
}
