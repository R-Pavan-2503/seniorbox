# OmniLog

OmniLog is a dark-theme React + Express + Supabase app for logging movies, TV series, and books. The backend proxies Open Library, Trakt, and OMDb so external API keys never live in the browser.

## Stack

- Frontend: React, TypeScript, Tailwind CSS v3, TanStack Query, Supabase Auth
- Backend: Node.js, Express.js, TypeScript
- Database: Supabase PostgreSQL with RLS
- External APIs: Open Library, Trakt, OMDb

## Setup

1. Create a Supabase project.
2. Run `supabase/migrations/202606040001_initial_schema.sql` in Supabase SQL Editor or via the Supabase CLI.
3. Copy `.env.example` into two files:
   - `backend/.env` with `PORT`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `TRAKT_API_KEY`, `OMDB_API_KEY`, and `FRONTEND_URL`.
   - `frontend/.env` with `VITE_API_URL`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY`.
4. In Supabase Auth, decide how local email login should work:
   - For fastest local testing, go to Authentication > Providers > Email and disable Confirm email.
   - If Confirm email stays enabled, confirm the user email in Supabase before logging in.
   - Login uses email + password. The profile username is not used for Supabase login.
5. Install dependencies.

```bash
npm install
npm run install:all
```

## Run

```bash
npm run dev --prefix backend
npm run dev --prefix frontend
```

Backend runs on `http://localhost:4000`. Frontend runs on `http://localhost:5173`.

## Build

```bash
npm run build --prefix backend
npm run build --prefix frontend
```

## API Summary

- `GET /api/search?q=&type=all|movie|tv|book`
- `GET /api/media/popular/:type`
- `GET /api/media/:type/:id`
- `GET /api/logs/me`
- `POST /api/logs`
- `DELETE /api/logs/:id`
- `GET /api/users/:username`
- `PUT /api/users/me/profile`
- `POST /api/users/:id/follow`
- `DELETE /api/users/:id/follow`
- `GET /api/lists/public`
- `GET /api/lists/:id`
- `GET /api/lists/mine/all`
- `POST /api/lists`
- `PUT /api/lists/:id`
- `DELETE /api/lists/:id`
- `POST /api/lists/:id/items`
- `PUT /api/lists/items/:itemId`
- `DELETE /api/lists/items/:itemId`
- `POST /api/lists/:id/like`
- `DELETE /api/lists/:id/like`
- `POST /api/lists/:id/comments`
- `GET /api/feed`
- `GET /api/activity`
