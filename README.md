# Harry Physics App

Harry Physics App is a split React + Express project for public physics lessons, simulations, student progress tracking, and admin-only content management.

## Architecture

- `client/`: Vite + React frontend
- `server/`: Express API with PostgreSQL storage
- `docker-compose.yml`: local PostgreSQL container

There is no local database file in the intended app architecture. The app should use PostgreSQL only.

## Local database with Docker

Start PostgreSQL in Docker:

```bash
docker compose up -d postgres
```

This creates a container named `harry-physics-postgres`.

Default local connection:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5433/harry_physics_app
```

The Postgres data lives in the Docker volume `harry_physics_postgres_data`, not in the codebase.

## Local setup

### Backend

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

### Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Vite proxies `/api` to `http://localhost:4000` during local development.

## Seeded accounts

- Admin: `admin / admin123`
- Student: `aisha / student123`
- Student: `brian / student123`
- Student: `claire / student123`
- Student: `daniel / student123`
- Student: `esther / student123`

## Vercel deployment

Use two Vercel projects for this repo.

### Frontend project

- Root Directory: `client`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment variable:

```env
VITE_API_URL=https://your-backend-project.vercel.app
```

### Backend project

- Root Directory: `server`
- Framework Preset: `Other`
- Vercel routing is prepared by `server/api/index.js` and `server/vercel.json`
- Environment variables:

```env
DATABASE_URL=postgres://...
FRONTEND_ORIGIN=https://your-frontend-project.vercel.app
PGSSL=require
```

## Production database

For Vercel hosting, use a managed PostgreSQL provider and set `DATABASE_URL` in the backend Vercel project.

- Vercel Postgres
- Neon
- Supabase Postgres
- Railway Postgres

## Access rules

- Public visitors can browse lessons, simulations, and quiz questions.
- Only logged-in student accounts can save quiz attempts and progress.
- Only logged-in admin accounts can access content entry and admin management.
