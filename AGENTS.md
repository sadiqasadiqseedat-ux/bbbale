# Base44 Development Environment

## Project Overview
B. B. Bale & Co. Chambers — a law firm management system. Vite + React 19 + TypeScript frontend with a
Cloudflare Pages Functions API. All business data is persisted in **Cloudflare D1**, the single source
of truth (previously client-side `localStorage`, now removed for business records).

## Architecture
- **Frontend → `/api/*` → API handler → `env.DB` (D1).**
- `src/server/apiHandler.ts` — `handleApiRequest(request, env)`; the API used by both the Pages Function
  and the dev server. Owns auth (password verification against D1) and all record CRUD.
- `functions/api/[[route]].ts` — Cloudflare Pages Function catch-all; forwards `/api/*` to
  `handleApiRequest` with the production `env.DB` binding (see `wrangler.toml`, database `bbbale`).
- **Dev database**: `vite.config.ts` registers `cloudflareD1ServerPlugin()`, which serves `/api/*` in the
  preview using `src/server/devD1Adapter.ts` — a `node:sqlite` shim that mirrors the D1 API and applies
  every `migrations/*.sql` on startup. Backing file: `.base44/chambers_d1_dev.sqlite` (git-ignored; it is
  recreated + re-seeded automatically, so deleting it is a safe reset).

## Running the App
```bash
docker compose -f docker-compose.base44.yml up -d
```
The app is served on **port 3000** by the Vite dev server (live reload enabled).

## Key Details
- **Peer dependency conflict**: the project pins `esbuild@^0.25.0` (devDependency) but Vite 8 requires
  `esbuild@^0.27.0 || ^0.28.0`, so a plain resolve fails with ERESOLVE. A committed root **`.npmrc`** sets
  `legacy-peer-deps=true`, which fixes it everywhere — in particular the `npm ci` that Cloudflare Pages runs
  automatically when `package-lock.json` is present (without it the Cloudflare build fails with `EUSAGE`).
- **No external secrets needed**: `@google/genai` and `express` are listed as dependencies but are not
  imported anywhere in `src/`.
- **Vite allowed hosts**: handled via `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` env var passed in compose.
- **HMR**: controlled by `DISABLE_HMR` env var in `vite.config.ts`. Not set in compose, so HMR is active.
  NOTE: `src/context/AuthContext.tsx` exports both a component and the `useAuth` hook, so Fast Refresh
  cannot hot-swap it cleanly ("useAuth must be used within an AuthProvider" appears transiently). A full
  preview reload resolves it; it is a dev-only HMR quirk, not an app bug.

## Health Check
The app is healthy when `http://localhost:3000/` returns HTTP 200.

## Initial Users (login)
The dev database is seeded on first start with 5 personnel accounts (see `INITIAL_STAFF_SEEDS` in
`src/server/apiHandler.ts`), e.g. `administrator`, `principal.partner`, `head.chamber`. All start with
password `admin@2026` and `requires_password_change = 1`, so the first sign-in opens a mandatory
password-change modal before the internal dashboard. Passwords are verified server-side against D1.
