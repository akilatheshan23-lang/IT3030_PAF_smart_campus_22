# Smart Campus Home + Admin Panel (Spring Boot + React + MongoDB)

This project is a starter full-stack implementation focused on the **Home Page** and **Admin Panel** for the IT3030 PAF assignment business scenario.

## Stack
- Backend: Spring Boot 3 + MongoDB
- Frontend: React + Vite
- Database: MongoDB Atlas

## Included screens
- Premium Home Page
- Admin Dashboard / Admin Panel
- Resource search on home page
- Booking review table in admin panel
- Booking status update flow: `PENDING -> APPROVED / REJECTED`, `APPROVED -> CANCELLED`

## Project structure
- `backend/` - Spring Boot REST API
- `frontend/` - React client

## Run backend
```bash
cd backend
mvn spring-boot:run
```

Backend runs on:
```bash
http://localhost:8080
```

## Run frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:
```bash
http://localhost:5173
```

## Notes
- The MongoDB connection is configured in `backend/src/main/resources/application.properties`.
- Seed data is added automatically if the collections are empty.
- Admin authentication is mocked on the frontend for easy demo purposes. Use the **Admin Panel** button from the home page.
- For a final academic submission, add proper OAuth 2.0, full role-based security, validation tests, and CI workflow.
