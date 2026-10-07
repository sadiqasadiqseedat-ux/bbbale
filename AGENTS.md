# Base44 Development Environment

## Project Overview
B. B. Bale & Co. Chambers — a law firm management system. Frontend-only Vite + React 19 + TypeScript app with Tailwind CSS v4. No backend server, no database — all data is client-side (in-memory/localStorage via `src/services/storage.ts`).

## Running the App
```bash
docker compose -f docker-compose.base44.yml up -d
```
The app is served on **port 3000** by the Vite dev server (live reload enabled).

## Key Details
- **No lockfile**: `npm install --legacy-peer-deps` is required due to an esbuild peer dependency conflict (package.json pins `esbuild@^0.25.0` but Vite 8 wants `^0.27.0`).
- **No external secrets needed**: `@google/genai` and `express` are listed as dependencies but are not imported anywhere in `src/`. The app runs without `GEMINI_API_KEY`.
- **Vite allowed hosts**: handled via `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` env var passed in compose.
- **HMR**: controlled by `DISABLE_HMR` env var in `vite.config.ts`. Not set in compose, so HMR is active.

## Health Check
The app is healthy when `http://localhost:3000/` returns HTTP 200.

## Initial Users (login)
All 5 initial accounts start with `requiresPasswordChange: true`. Passwords are hashed at runtime during storage initialization (see `src/services/crypto.ts` and `src/services/storage.ts`).
