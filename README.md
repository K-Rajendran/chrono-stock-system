# SOUL x TIME — Premium Watch Commerce Platform

> **Where Time Finds Its Soul**

A production-oriented, full-stack luxury watch commerce platform featuring a cinematic 3D interface, complete inventory management, WhatsApp-powered purchase workflow, and a robust admin billing system.

---

## Architecture Overview

```
User → Next.js Frontend (Vercel/CDN)
         ↓ HTTPS
       Spring Boot API (Railway/Render/AWS)
         ↓
       PostgreSQL (Managed DB)
```

**Frontend:** Next.js 14 + TypeScript + Tailwind CSS + React Three Fiber + Framer Motion  
**Backend:** Java 21 + Spring Boot 3 + Spring Security + Spring Data JPA  
**Database:** PostgreSQL 15 + Flyway migrations  
**Auth:** JWT with HTTP-only cookie refresh tokens  

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20 LTS |
| Java | 21 LTS |
| PostgreSQL | 15+ |
| Maven | 3.9+ |
| Git | Any recent |
| Docker (optional) | 24+ |

---

## Quick Start

### Step 1 — Clone

```bash
git clone https://github.com/your-org/soul-x-time.git
cd soul-x-time
```

### Step 2 — Configure Environment

```bash
cp .env.example .env
# Edit .env with your values
```

### Step 3 — Start PostgreSQL

**Option A: Docker (recommended for local dev)**
```bash
docker-compose up -d postgres
```

**Option B: Local PostgreSQL**
```sql
CREATE DATABASE soulxtime;
CREATE USER soulxtime_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE soulxtime TO soulxtime_user;
```

### Step 4 — Configure Backend Environment

```bash
cd backend
cp src/main/resources/application.yml.example src/main/resources/application-local.yml
# Edit with your DB credentials
```

### Step 5 — Start Backend (Flyway runs automatically on startup)

```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
# Backend starts at http://localhost:8080
```

### Step 6 — Seed Development Data

```bash
# Seed data runs automatically via Flyway V99 migration in local profile
# Or manually:
curl -X POST http://localhost:8080/api/admin/seed \
  -H "Content-Type: application/json"
```

### Step 7 — Start Frontend

```bash
cd frontend
npm install
npm run dev
# Frontend starts at http://localhost:3000
```

### Step 8 — Open App

- **Customer store:** http://localhost:3000
- **Admin dashboard:** http://localhost:3000/admin
- **API health:** http://localhost:8080/actuator/health

---

## Development Credentials (seed data only)

> ⚠️ These are development-only credentials. Never use in production.

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@soulxtime.com | Admin@123 |
| Customer | customer@demo.com | Customer@123 |

---

## Environment Variables

See `.env.example` for full reference.

### Critical Variables

```env
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8080

# Backend
DATABASE_URL=jdbc:postgresql://localhost:5432/soulxtime
DATABASE_USERNAME=soulxtime_user
DATABASE_PASSWORD=your_secure_password
JWT_SECRET=your_256_bit_secret_minimum
JWT_ACCESS_EXPIRY_MS=900000
JWT_REFRESH_EXPIRY_MS=604800000

# WhatsApp
WHATSAPP_MODE=LINK
WHATSAPP_OWNER_NUMBER=919XXXXXXXXX
```

---

## Test Commands

### Backend

```bash
cd backend
./mvnw test
./mvnw test -pl . -Dtest=BillServiceTest
./mvnw test -pl . -Dtest=InventoryServiceTest
./mvnw verify  # includes integration tests
```

### Frontend

```bash
cd frontend
npm test
npm run test:e2e   # Playwright E2E tests
npm run test:ci    # CI mode
```

---

## Production Build

### Frontend

```bash
cd frontend
npm run build
npm start
```

### Backend

```bash
cd backend
./mvnw clean package -Pproduction
java -jar target/soul-x-time-backend.jar
```

---

## Project Structure

```
soul-x-time/
├── frontend/           # Next.js 14 app
├── backend/            # Spring Boot 3 app
├── docs/               # Architecture & API docs
├── docker-compose.yml  # Local dev services
├── .env.example        # Environment template
└── README.md
```

---

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [Database Schema](docs/DATABASE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
