# Audy Learning Centre (ALC)

Premium corporate Learning Management System for Audy Dental Clinic.

## Tech Stack

- **Frontend:** SvelteKit 2 + Svelte 5 (runes) + TypeScript
- **Styling:** Tailwind CSS v4
- **Backend:** SvelteKit server routes
- **Database:** Supabase PostgreSQL (RLS enabled)
- **Auth:** Supabase Auth + `@supabase/ssr` (cookie-based SSR)
- **Runtime:** Bun (dev) / Node.js (Vercel)
- **Deployment:** Vercel

## Development Setup

### 1. Prerequisites

- [Bun](https://bun.sh) ≥ 1.3 or Node.js ≥ 20
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for local DB)
- A Supabase project (cloud or local)

### 2. Install dependencies

```bash
# Using npm (recommended on Windows until Bun cache issue is resolved)
npm install

# Or with Bun (requires Developer Mode on Windows)
bun install
```

### 3. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local with your Supabase project credentials
```

Required variables:

| Variable                          | Where to find                                          |
| --------------------------------- | ------------------------------------------------------ |
| `PUBLIC_SUPABASE_URL`             | Supabase Dashboard → Settings → API → Project URL      |
| `PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase Dashboard → Settings → API → anon/public key  |
| `SUPABASE_SERVICE_ROLE_KEY`       | Supabase Dashboard → Settings → API → service_role key |

### 4. Run migrations

```bash
# Using Supabase CLI with local dev
supabase db reset

# Or apply migrations to a cloud project
supabase db push
```

### 5. Seed development data

```bash
# After migrations, seed the database
supabase db seed --file supabase/seed.sql

# Then create test users via Supabase Dashboard → Authentication → Users
# and update their profiles with:
#   role: ADMIN or STAFF
#   department_id / position_id from the seed data
```

### 6. Start development server

```bash
npm run dev
# or
bun run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Available Scripts

| Script             | Description                          |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Start development server             |
| `npm run build`    | Production build                     |
| `npm run preview`  | Preview production build             |
| `npm run check`    | TypeScript + Svelte check            |
| `npm run lint`     | ESLint + Prettier check              |
| `npm run format`   | Format all files                     |
| `npm run test`     | Run unit tests                       |
| `npm run db:types` | Regenerate Supabase TypeScript types |

## Database Type Generation

After any schema changes, regenerate the TypeScript types:

```bash
npm run db:types
```

This requires the Supabase CLI to be installed and your local Supabase instance running.

## Roles

| Role    | Description                                      |
| ------- | ------------------------------------------------ |
| `ADMIN` | Full system access, admin panel, user management |
| `STAFF` | Access to all learning modules                   |

## Positions (Content Filter)

Position controls which content a user sees — it is NOT an authorization mechanism.

| Position       | Label        |
| -------------- | ------------ |
| `RESEPSIONIS`  | Resepsionis  |
| `PERAWAT_GIGI` | Perawat Gigi |
| `SUPERVISOR`   | Supervisor   |

## Windows Developer Notes

**Bun cache EPERM:** Bun's atomic rename fails on some Windows machines. Use `npm install` instead.

**Vercel adapter symlinks:** `@sveltejs/adapter-vercel` creates symlinks during `npm run build`. On Windows this requires Developer Mode (Settings → Privacy & Security → Developer Mode → On). The Vite compilation step itself completes fine — only the packaging step is affected. This does not affect Vercel CI.

## Project Structure

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full architecture reference.

## Development Phases

See [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md) for the phased build plan.
