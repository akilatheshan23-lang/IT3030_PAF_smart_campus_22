package com.smartcampus.repository;

import com.smartcampus.model.TechnicianAccount;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface TechnicianAccountRepository extends MongoRepository<TechnicianAccount, String> {
    Optional<TechnicianAccount> findByEmail(String email);
}
