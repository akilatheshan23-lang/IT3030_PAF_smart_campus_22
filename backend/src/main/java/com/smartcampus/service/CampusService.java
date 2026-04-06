package com.smartcampus.service;

import com.smartcampus.dto.BookingRequest;
import com.smartcampus.dto.BookingStatusUpdateRequest;
import com.smartcampus.model.Booking;
import com.smartcampus.model.BookingStatus;
import com.smartcampus.model.Resource;
import com.smartcampus.model.ResourceStatus;
import com.smartcampus.repository.BookingRepository;
import com.smartcampus.repository.ResourceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class CampusService {

    private final ResourceRepository resourceRepository;
    private final BookingRepository bookingRepository;

    public CampusService(ResourceRepository resourceRepository, BookingRepository bookingRepository) {
        this.resourceRepository = resourceRepository;
        this.bookingRepository = bookingRepository;
    }

    public Map<String, Object> getHomeOverview() {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("title", "Smart Campus Operations Hub");
        data.put("subtitle", "Book campus spaces, manage operations, and review requests from one premium platform.");
        data.put("features", List.of(
                Map.of("title", "Smart Resource Search", "desc", "Explore lecture halls, labs, meeting rooms, and equipment."),
                Map.of("title", "Fast Booking Workflow", "desc", "Submit and track requests with clear approval statuses."),
                Map.of("title", "Centralized Operations", "desc", "Bring bookings and admin reviews together in one system."),
                Map.of("title", "Premium UI Experience", "desc", "Designed for clear navigation, clean cards, and dashboards.")
        ));
        return data;
    }

    public List<Resource> getPublicResources(String type, String location, Integer minCapacity) {
        return resourceRepository.findAll().stream()
                .filter(resource -> resource.getStatus() == ResourceStatus.ACTIVE)
                .filter(resource -> isBlank(type) || equalsIgnoreCase(resource.getType(), type))
                .filter(resource -> isBlank(location) || containsIgnoreCase(resource.getLocation(), location))
                .filter(resource -> minCapacity == null || resource.getCapacity() >= minCapacity)
                .sorted(Comparator.comparing(Resource::getName, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    public Map<String, Object> getAdminSummary() {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("pendingBookings", bookingRepository.countByStatus(BookingStatus.PENDING));
        data.put("approvedBookings", bookingRepository.countByStatus(BookingStatus.APPROVED));
        data.put("rejectedBookings", bookingRepository.countByStatus(BookingStatus.REJECTED));
        data.put("cancelledBookings", bookingRepository.countByStatus(BookingStatus.CANCELLED));
        data.put("totalResources", resourceRepository.count());
        data.put("recentAlerts", List.of(
                "Pending booking requests require review",
                "Out-of-service resource should be monitored",
                "Recent booking updates were processed successfully"
        ));
        return data;
    }

    public List<Booking> getAdminBookings(BookingStatus status, String resourceName, String bookingDate) {
        return bookingRepository.findAll().stream()
                .filter(booking -> status == null || booking.getStatus() == status)
                .filter(booking -> isBlank(resourceName) || containsIgnoreCase(booking.getResourceName(), resourceName))
                .filter(booking -> isBlank(bookingDate) || bookingDate.equals(booking.getBookingDate()))
                .sorted(Comparator.comparing(Booking::getBookingDate).reversed().thenComparing(Booking::getStartTime))
                .toList();
    }

    public Booking updateBookingStatus(String bookingId, BookingStatusUpdateRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found."));

        BookingStatus current = booking.getStatus();
        BookingStatus target = request.getStatus();

        if (current == BookingStatus.PENDING && target != BookingStatus.APPROVED && target != BookingStatus.REJECTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pending booking can only be approved or rejected.");
        }

        if (current == BookingStatus.APPROVED && target != BookingStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Approved booking can only be cancelled.");
        }

        if (current == BookingStatus.REJECTED || current == BookingStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Finalized booking cannot be updated again.");
        }

        if (target == BookingStatus.REJECTED && isBlank(request.getReason())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reason is required when rejecting a booking.");
        }

        if (target == BookingStatus.APPROVED && hasConflict(booking)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Time conflict detected for the selected resource.");
        }

        booking.setStatus(target);
        booking.setDecisionReason(request.getReason());
        return bookingRepository.save(booking);
    }

    public Booking createBooking(BookingRequest request) {
        LocalDate bookingDate;
        try {
            bookingDate = LocalDate.parse(request.getBookingDate());
        } catch (DateTimeParseException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid date format. Use YYYY-MM-DD.");
        }

        if (bookingDate.isBefore(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Booking date cannot be in the past.");
        }

        LocalTime start = parseTime(request.getStartTime());
        LocalTime end = parseTime(request.getEndTime());

        if (!start.isBefore(end)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End time must be after start time.");
        }

        Booking booking = new Booking();
        booking.setBookingCode("BK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT));
        booking.setRequesterName(request.getRequesterName());
        booking.setRequesterEmail(request.getRequesterEmail());
        booking.setResourceId(request.getResourceId());
        booking.setResourceName(request.getResourceName());
        booking.setBookingDate(request.getBookingDate());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setPurpose(request.getPurpose());
        booking.setAttendeeCount(request.getAttendeeCount());
        booking.setStatus(BookingStatus.PENDING);
        booking.setDecisionReason("");

        if (hasConflict(booking)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Time conflict detected for this resource.");
        }

        return bookingRepository.save(booking);
    }

    public List<Booking> getUserBookings(String email) {
        if (isBlank(email)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required to fetch bookings.");
        }
        return bookingRepository.findByRequesterEmailOrderByBookingDateDesc(email);
    }

    public Booking cancelUserBooking(String bookingId, String email) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found."));

        if (!equalsIgnoreCase(booking.getRequesterEmail(), email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to cancel this booking.");
        }

        if (booking.getStatus() == BookingStatus.REJECTED
                || booking.getStatus() == BookingStatus.CANCELLED
                || booking.getStatus() == BookingStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Booking is already finalized.");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setDecisionReason("Cancelled by user.");
        return bookingRepository.save(booking);
    }

    private boolean hasConflict(Booking booking) {
        List<Booking> approvedBookings = new ArrayList<>(bookingRepository.findByStatus(BookingStatus.APPROVED));
        LocalTime currentStart = parseTime(booking.getStartTime());
        LocalTime currentEnd = parseTime(booking.getEndTime());

        for (Booking other : approvedBookings) {
            if (other.getId().equals(booking.getId())) {
                continue;
            }
            if (!other.getResourceId().equals(booking.getResourceId())) {
                continue;
            }
            if (!other.getBookingDate().equals(booking.getBookingDate())) {
                continue;
            }

            LocalTime otherStart = parseTime(other.getStartTime());
            LocalTime otherEnd = parseTime(other.getEndTime());
            boolean overlaps = currentStart.isBefore(otherEnd) && currentEnd.isAfter(otherStart);
            if (overlaps) {
                return true;
            }
        }
        return false;
    }

    private LocalTime parseTime(String value) {
        try {
            return LocalTime.parse(value);
        } catch (DateTimeParseException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid time format. Use HH:mm.");
        }
    }

    private boolean containsIgnoreCase(String source, String value) {
        return source != null && source.toLowerCase(Locale.ROOT).contains(value.toLowerCase(Locale.ROOT));
    }

    private boolean equalsIgnoreCase(String source, String value) {
        return source != null && source.equalsIgnoreCase(value);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}