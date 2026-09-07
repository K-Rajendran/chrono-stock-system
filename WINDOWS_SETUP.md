# SOUL x TIME — Windows Setup Guide (PowerShell)

## Prerequisites

Install these tools before starting:

| Tool | Download | Min Version |
|------|----------|-------------|
| Node.js LTS | https://nodejs.org | 20 |
| JDK 21 | https://adoptium.net | 21 |
| Docker Desktop | https://docker.com | 24 |
| Git | https://git-scm.com | Any |

Verify installations:
```powershell
node --version    # v20.x.x
java --version    # 21.x.x
docker --version  # 24.x.x
```

---

## Step 1 — Extract Project

Extract `soul-x-time.zip` to a folder, e.g. `C:\Projects\soul-x-time`

```powershell
cd C:\Projects\soul-x-time
```

---

## Step 2 — Configure Environment

```powershell
# Backend
Copy-Item backend\src\main\resources\application.yml backend\src\main\resources\application-local.yml
# Edit application-local.yml with your DB settings if not using Docker

# Frontend
Copy-Item frontend\.env.local.example frontend\.env.local
# Edit .env.local if needed (default works with Docker setup)
```

---

## Step 3 — Start PostgreSQL via Docker

```powershell
# From the soul-x-time root directory:
docker-compose up -d postgres

# Verify it's running:
docker-compose ps
```

---

## Step 4 — Start Backend (Flyway migrations run automatically)

```powershell
cd backend

# Windows:
mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=local

# Or with Maven installed globally:
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

Wait for: `Started SoulXTimeApplication in X.XXX seconds`

**Backend runs at:** http://localhost:8080  
**Health check:** http://localhost:8080/actuator/health

---

## Step 5 — Start Frontend

Open a **new** PowerShell window:

```powershell
cd C:\Projects\soul-x-time\frontend

npm install

npm run dev
```

Wait for: `ready - started server on 0.0.0.0:3000`

**Frontend runs at:** http://localhost:3000

---

## Step 6 — Open in Browser

- **Store:** http://localhost:3000
- **Admin:** http://localhost:3000/admin

### Development Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@soulxtime.com | Admin@123 |
| Customer | customer@demo.com | Customer@123 |

---

## Troubleshooting

### Port 5432 already in use
```powershell
# Stop existing PostgreSQL service
Stop-Service postgresql* -ErrorAction SilentlyContinue
# Then retry: docker-compose up -d postgres
```

### Maven not found (mvnw.cmd fails)
```powershell
# Install Maven from https://maven.apache.org
# Or use IntelliJ IDEA which bundles Maven
```

### CORS errors in browser
Make sure backend is running on port 8080 and frontend on 3000.
Check `CORS_ALLOWED_ORIGINS` in your backend config.

### npm install fails
```powershell
# Clear npm cache and retry
npm cache clean --force
npm install
```

---

## Running Tests

```powershell
# Backend tests
cd backend
mvnw.cmd test

# Frontend lint
cd frontend
npm run lint
```

---

## Stopping Everything

```powershell
# Stop Docker services
docker-compose down

# Stop backend: Ctrl+C in its PowerShell window
# Stop frontend: Ctrl+C in its PowerShell window
```
