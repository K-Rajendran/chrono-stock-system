# SOUL x TIME — Deployment Guide

## Production Architecture

```
User
 │
 ▼ HTTPS
Vercel / Netlify / CloudFront
 │ (Next.js static + SSR)
 │
 ▼ HTTPS API calls
Railway / Render / AWS ECS
 │ (Spring Boot JAR)
 │
 ▼ TCP
Neon / Supabase / AWS RDS
 (PostgreSQL 15+)
```

## Option A: Railway (Easiest Full-Stack)

### Backend

1. Connect GitHub repo to Railway
2. Set root directory: `backend`
3. Add environment variables (see `.env.example`)
4. Railway auto-detects Maven and builds the JAR
5. Set start command: `java -jar target/soul-x-time-backend.jar`

### Frontend

1. Add new Railway service, root directory: `frontend`
2. Set `NEXT_PUBLIC_API_URL` to your backend Railway URL
3. Railway auto-detects Next.js

### Database

1. Add PostgreSQL plugin in Railway
2. Copy `DATABASE_URL` to backend service variables

## Option B: Vercel + Render

### Frontend → Vercel

```bash
cd frontend
npx vercel --prod
# Set NEXT_PUBLIC_API_URL to your Render backend URL
```

### Backend → Render

1. Create Web Service on Render
2. Root directory: `backend`
3. Build command: `./mvnw clean package -DskipTests`
4. Start command: `java -jar target/soul-x-time-backend.jar`
5. Add environment variables

### Database → Neon (Serverless Postgres)

1. Create project at neon.tech
2. Copy connection string to `DATABASE_URL`
3. Flyway migrations run automatically on startup

## Environment Variables Checklist

### Backend (Required for Production)
```env
DATABASE_URL=jdbc:postgresql://<host>/<db>
DATABASE_USERNAME=<user>
DATABASE_PASSWORD=<strong-password>
JWT_SECRET=<256-bit-random-string>
JWT_COOKIE_SECURE=true
CORS_ALLOWED_ORIGINS=https://yourdomain.com
SPRING_PROFILES_ACTIVE=production
WHATSAPP_OWNER_NUMBER=<your-number>
BILL_NUMBER_PREFIX=ST
ADMIN_OWNER_NAME=<your-name>
ADMIN_OWNER_PHONE=<your-phone>
```

### Frontend (Required for Production)
```env
NEXT_PUBLIC_API_URL=https://your-api.railway.app
```

## Database Migrations

Flyway runs automatically on Spring Boot startup.
- `V1__initial_schema.sql` — creates all tables
- `V2__seed_data.sql` — development seed data (skip in production)

To skip seed data in production, set:
```env
SPRING_FLYWAY_LOCATIONS=classpath:db/migration/V1__initial_schema.sql
```
or remove V2 from the migration folder before deploying.

## Health Check

The backend exposes:
```
GET /actuator/health
```
Use this as your load balancer / uptime check endpoint.

## HTTPS

- Vercel/Railway/Render: HTTPS automatic via their infrastructure
- Custom domain: Use Cloudflare or Let's Encrypt
- Set `JWT_COOKIE_SECURE=true` when using HTTPS

## Production Logging

```env
LOG_LEVEL=INFO
```

For structured logging in production, add Logback JSON appender or connect to Datadog/Grafana.

## Backup Strategy

- Enable automated daily backups in your managed Postgres provider
- Before any major deployment: `pg_dump soulxtime > backup_$(date +%Y%m%d).sql`
- Test restore process quarterly

## Rollback

1. Railway/Render: re-deploy previous commit from dashboard
2. Database: never auto-rollback migrations; run compensating migrations manually
3. Keep migration files immutable once deployed to production
