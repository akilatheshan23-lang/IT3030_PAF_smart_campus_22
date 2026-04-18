package com.smartcampus.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.smartcampus.model.Booking;
import com.smartcampus.model.BookingStatus;

public interface BookingRepository extends MongoRepository<Booking, String> {
    long countByStatus(BookingStatus status);
    List<Booking> findByStatus(BookingStatus status);
    List<Booking> findByRequesterEmailOrderByBookingDateDesc(String email);
    boolean existsByResourceIdAndStatusIn(String resourceId, List<BookingStatus> statuses);
}