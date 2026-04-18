package com.smartcampus.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.smartcampus.dto.BookingRequest;
import com.smartcampus.dto.BookingStatusUpdateRequest;
import com.smartcampus.dto.ResourceCreateRequest;
import com.smartcampus.dto.ResourceUpdateRequest;
import com.smartcampus.model.Booking;
import com.smartcampus.model.BookingStatus;
import com.smartcampus.model.Resource;
import com.smartcampus.model.ResourceStatus;
import com.smartcampus.repository.BookingRepository;
import com.smartcampus.repository.ResourceRepository;

@Service
public class CampusService {

    private static final DateTimeFormatter HH_MM_FORMAT = DateTimeFormatter.ofPattern("HH:mm");

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

    public List<Resource> getAdminResources(ResourceStatus status,
                                            String type,
                                            String location,
                                            Integer minCapacity,
                                            String name) {
        if (minCapacity != null && minCapacity <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "minCapacity must be greater than zero.");
        }

        return resourceRepository.findAll().stream()
                .filter(resource -> status == null || resource.getStatus() == status)
                .filter(resource -> isBlank(type) || equalsIgnoreCase(resource.getType(), type))
                .filter(resource -> isBlank(location) || containsIgnoreCase(resource.getLocation(), location))
                .filter(resource -> isBlank(name) || containsIgnoreCase(resource.getName(), name))
                .filter(resource -> minCapacity == null || resource.getCapacity() >= minCapacity)
                .sorted(Comparator
                        .comparing(Resource::getType, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
                        .thenComparing(Resource::getName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .toList();
    }

    public Resource createResource(ResourceCreateRequest request) {
        String name = ensureNotBlank(request.getName(), "Resource name is required.");
        String type = ensureNotBlank(request.getType(), "Resource type is required.");
        String location = ensureNotBlank(request.getLocation(), "Location is required.");
        String availabilityWindow = normalizeAvailabilityWindow(request.getAvailabilityWindow());
        ResourceStatus status = request.getStatus() != null ? request.getStatus() : ResourceStatus.ACTIVE;
        validateNoDuplicateResource(null, name, type, location);

        Resource resource = new Resource();
        resource.setName(name);
        resource.setType(type);
        resource.setCapacity(request.getCapacity());
        resource.setLocation(location);
        resource.setAvailabilityWindow(availabilityWindow);
        resource.setStatus(status);
        return resourceRepository.save(resource);
    }

    public Resource updateResource(String resourceId, ResourceCreateRequest request) {
        Resource resource = getResourceById(resourceId);

        String name = ensureNotBlank(request.getName(), "Resource name is required.");
        String type = ensureNotBlank(request.getType(), "Resource type is required.");
        String location = ensureNotBlank(request.getLocation(), "Location is required.");
        String availabilityWindow = normalizeAvailabilityWindow(request.getAvailabilityWindow());
        ResourceStatus status = request.getStatus() != null ? request.getStatus() : ResourceStatus.ACTIVE;

        validateNoDuplicateResource(resourceId, name, type, location);

        resource.setName(name);
        resource.setType(type);
        resource.setCapacity(request.getCapacity());
        resource.setLocation(location);
        resource.setAvailabilityWindow(availabilityWindow);
        resource.setStatus(status);

        return resourceRepository.save(resource);
    }

    public Resource patchResource(String resourceId, ResourceUpdateRequest request) {
        if (request.getName() == null
                && request.getType() == null
                && request.getCapacity() == null
                && request.getLocation() == null
                && request.getAvailabilityWindow() == null
                && request.getStatus() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "At least one field must be provided for update.");
        }

        Resource resource = getResourceById(resourceId);

        String name = request.getName() != null
                ? ensureNotBlank(request.getName(), "Resource name cannot be blank.")
                : resource.getName();
        String type = request.getType() != null
                ? ensureNotBlank(request.getType(), "Resource type cannot be blank.")
                : resource.getType();
        String location = request.getLocation() != null
                ? ensureNotBlank(request.getLocation(), "Location cannot be blank.")
                : resource.getLocation();
        String availabilityWindow = request.getAvailabilityWindow() != null
                ? normalizeAvailabilityWindow(request.getAvailabilityWindow())
                : resource.getAvailabilityWindow();
        Integer capacity = request.getCapacity() != null ? request.getCapacity() : resource.getCapacity();
        ResourceStatus status = request.getStatus() != null ? request.getStatus() : resource.getStatus();

        validateNoDuplicateResource(resourceId, name, type, location);

        resource.setName(name);
        resource.setType(type);
        resource.setCapacity(capacity);
        resource.setLocation(location);
        resource.setAvailabilityWindow(availabilityWindow);
        resource.setStatus(status);

        return resourceRepository.save(resource);
    }

    public void deleteResource(String resourceId) {
        Resource resource = getResourceById(resourceId);

        List<BookingStatus> blockingStatuses = List.of(BookingStatus.PENDING, BookingStatus.APPROVED);
        if (bookingRepository.existsByResourceIdAndStatusIn(resourceId, blockingStatuses)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Resource cannot be deleted while it has pending or approved bookings.");
        }

        resourceRepository.delete(resource);
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
        String requesterEmail = ensureNotBlank(request.getRequesterEmail(), "Requester email is required.");
        String requesterName = ensureNotBlank(request.getRequesterName(), "Requester name is required.");
        String resourceId = ensureNotBlank(request.getResourceId(), "Resource ID is required.");

        Resource resource = getResourceById(resourceId);
        if (resource.getStatus() != ResourceStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Selected resource is not available for booking.");
        }

        LocalDate bookingDate = parseBookingDate(request.getBookingDate());

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
        booking.setRequesterName(requesterName);
        booking.setRequesterEmail(requesterEmail);
        booking.setResourceId(resourceId);
        booking.setResourceName(resource.getName());
        booking.setBookingDate(bookingDate.format(DateTimeFormatter.ISO_LOCAL_DATE));
        booking.setStartTime(start.format(HH_MM_FORMAT));
        booking.setEndTime(end.format(HH_MM_FORMAT));
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
        return bookingRepository.findByRequesterEmailIgnoreCaseOrderByBookingDateDesc(email);
    }

    public Booking cancelUserBooking(String bookingId, String email, String reason) {
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
        String finalReason = (reason != null && !reason.isBlank()) ? "Cancelled by user: " + reason : "Cancelled by user.";
        booking.setDecisionReason(finalReason);
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
        if (isBlank(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Time value is required.");
        }

        String trimmed = value.trim();
        try {
            return LocalTime.parse(trimmed);
        } catch (DateTimeParseException ex) {
            try {
                DateTimeFormatter twelveHour = new DateTimeFormatterBuilder()
                        .parseCaseInsensitive()
                        .appendPattern("h:mm")
                        .optionalStart().appendPattern(":ss").optionalEnd()
                        .appendPattern(" a")
                        .toFormatter(Locale.ENGLISH);
                return LocalTime.parse(trimmed, twelveHour);
            } catch (DateTimeParseException inner) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid time format. Use HH:mm.");
            }
        }
    }

    private LocalDate parseBookingDate(String value) {
        if (isBlank(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Booking date is required.");
        }

        String trimmed = value.trim();
        try {
            return LocalDate.parse(trimmed);
        } catch (DateTimeParseException ex) {
            try {
                DateTimeFormatter altUs = DateTimeFormatter.ofPattern("MM/dd/yyyy", Locale.ENGLISH);
                return LocalDate.parse(trimmed, altUs);
            } catch (DateTimeParseException inner) {
                try {
                    DateTimeFormatter altIntl = DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.ENGLISH);
                    return LocalDate.parse(trimmed, altIntl);
                } catch (DateTimeParseException innerMost) {
                    try {
                        DateTimeFormatter altIso = DateTimeFormatter.ofPattern("yyyy/MM/dd", Locale.ENGLISH);
                        return LocalDate.parse(trimmed, altIso);
                    } catch (DateTimeParseException finalEx) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid date format. Use YYYY-MM-DD.");
                    }
                }
            }
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

    private Resource getResourceById(String resourceId) {
        return resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found."));
    }

    private void validateNoDuplicateResource(String currentResourceId, String name, String type, String location) {
        resourceRepository.findByNameIgnoreCaseAndTypeIgnoreCaseAndLocationIgnoreCase(name, type, location)
                .ifPresent(existing -> {
                    if (!existing.getId().equals(currentResourceId)) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT,
                                "A resource with the same name, type, and location already exists.");
                    }
                });
    }

    private String normalize(String value) {
        return value == null ? null : value.trim().replaceAll("\\s+", " ");
    }

    private String ensureNotBlank(String value, String errorMessage) {
        String normalized = normalize(value);
        if (isBlank(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorMessage);
        }
        return normalized;
    }

    private String normalizeAvailabilityWindow(String value) {
        if (isBlank(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Availability window is required.");
        }

        String[] parts = value.split("-");
        if (parts.length != 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid availability window format. Use HH:mm - HH:mm.");
        }

        LocalTime start = parseTime(parts[0].trim());
        LocalTime end = parseTime(parts[1].trim());

        if (!start.isBefore(end)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Availability window end time must be after start time.");
        }

        return start.format(HH_MM_FORMAT) + " - " + end.format(HH_MM_FORMAT);
    }
}