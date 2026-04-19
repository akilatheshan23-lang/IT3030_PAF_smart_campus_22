package com.smartcampus.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.smartcampus.model.Booking;
import com.smartcampus.model.BookingStatus;

public interface BookingRepository extends MongoRepository<Booking, String> {
    long countByStatus(BookingStatus status);
    List<Booking> findByStatus(BookingStatus status);
    List<Booking> findByRequesterEmailOrderByBookingDateDesc(String email);
<<<<<<< HEAD
    List<Booking> findByRequesterEmailIgnoreCaseOrderByBookingDateDesc(String email);
=======
>>>>>>> ae31933d4c5b938a7be19bce3b8c52635ecb13d4
    boolean existsByResourceIdAndStatusIn(String resourceId, List<BookingStatus> statuses);
}