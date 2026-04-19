package com.smartcampus.seed;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.smartcampus.model.Booking;
import com.smartcampus.model.BookingStatus;
import com.smartcampus.model.Resource;
import com.smartcampus.model.ResourceStatus;
import com.smartcampus.repository.BookingRepository;
import com.smartcampus.repository.ResourceRepository;

@Component
public class DataSeeder implements CommandLineRunner {

    private final ResourceRepository resourceRepository;
    private final BookingRepository bookingRepository;

    public DataSeeder(ResourceRepository resourceRepository, BookingRepository bookingRepository) {
        this.resourceRepository = resourceRepository;
        this.bookingRepository = bookingRepository;
    }

    @Override
    public void run(String... args) {
        if (resourceRepository.count() == 0) {
            Resource hall = resourceRepository.save(new Resource(
                    "Main Lecture Hall A",
                    "Lecture Hall",
                    180,
                    "Block A",
                    "Faculty of Computing",
                    "08:00 - 18:00",
                    ResourceStatus.ACTIVE
            ));
            Resource lab = resourceRepository.save(new Resource(
                    "Computing Lab 03",
                    "Lab",
                    60,
                    "Block C",
                    "Faculty of Computing",
                    "09:00 - 17:00",
                    ResourceStatus.ACTIVE
            ));
            Resource room = resourceRepository.save(new Resource(
                    "Innovation Meeting Room",
                    "Meeting Room",
                    20,
                    "Admin Building",
                    "Engineering Department",
                    "08:30 - 16:30",
                    ResourceStatus.ACTIVE
            ));
            resourceRepository.save(new Resource(
                    "Projector Unit P-12",
                    "Equipment",
                    1,
                    "Media Store",
                    "Architecture Department",
                    "08:00 - 15:00",
                    ResourceStatus.OUT_OF_SERVICE
            ));

            if (bookingRepository.count() == 0) {
                bookingRepository.saveAll(List.of(
                        new Booking(
                                "BK-1001", "Nimal Perera", "nimal@example.com", hall.getId(), hall.getName(),
                                "2026-04-15", "09:00", "11:00", "Faculty presentation", 120,
                                BookingStatus.PENDING, ""
                        ),
                        new Booking(
                                "BK-1002", "Kasun Silva", "kasun@example.com", lab.getId(), lab.getName(),
                                "2026-04-15", "13:00", "15:00", "Programming practical", 40,
                                BookingStatus.APPROVED, "Approved for scheduled practical"
                        ),
                        new Booking(
                                "BK-1003", "Sanjana Fernando", "sanjana@example.com", room.getId(), room.getName(),
                                "2026-04-16", "10:00", "11:00", "Committee meeting", 10,
                                BookingStatus.REJECTED, "Room unavailable due to admin use"
                        )
                ));
            }
        }
    }
}
