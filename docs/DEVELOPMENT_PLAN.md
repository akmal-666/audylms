# DEVELOPMENT PLAN — AUDY LEARNING CENTRE (ALC)

**Version:** 1.0
**Date:** 2026-10-07

---

## Overview

The project is divided into 7 phases. Each phase builds on the previous and delivers a testable, deployable increment.

**No business module logic is implemented until Phase 2.**

---

## Phase 0 — Audit & Architecture ✅

**Status:** COMPLETE (this document is the output)

**Goal:** Understand the existing codebase and define the full architecture before writing a single line of product code.

**Deliverables:**

- [x] `docs/PROJECT_AUDIT.md` — full inspection report
- [x] `docs/ARCHITECTURE.md` — target system design
- [x] `docs/DEVELOPMENT_PLAN.md` — phased implementation roadmap

**Findings:**

- Repository is empty (greenfield)
- No existing code, dependencies, or configuration
- Bun 1.3.11, Node 24.14.1, Git 2.53 confirmed available
- No Vercel CLI installed (install before Phase 5)
- Zero technical debt; full design freedom

---

## Phase 1 — Project Scaffold & Foundation

**Goal:** Create a production-ready project skeleton. No business features. Every config file, lint rule, CI job, and deployment pipeline must work before any module is built.

**Estimated effort:** 1–2 days

### 1.1 SvelteKit + Bun Initialization

- [ ] `bun create svelte@latest .` with TypeScript + ESLint + Prettier
- [ ] Confirm Svelte 5 (runes) is used
- [ ] Configure `@sveltejs/adapter-vercel`
- [ ] Confirm `bun run dev` starts correctly
- [ ] Confirm `bun run build` produces a clean build

### 1.2 Tailwind CSS Setup

- [ ] Install Tailwind CSS v4 + `@tailwindcss/vite`
- [ ] Configure `tailwind.config.ts` with design tokens (colors, fonts, radii)
- [ ] Add `app.css` with `@import "tailwindcss"` + CSS custom properties
- [ ] Verify Tailwind classes render correctly on a test page

### 1.3 TypeScript Configuration

- [ ] Strict mode enabled (`"strict": true`)
- [ ] Path aliases configured: `$lib` → `src/lib`
- [ ] `src/app.d.ts` with `App.Locals` type (supabase, user session)

### 1.4 Supabase Integration

- [ ] Install `@supabase/supabase-js` and `@supabase/ssr`
- [ ] Create `src/lib/supabase/client.ts` (browser client, singleton)
- [ ] Create `src/lib/server/supabase.ts` (server client factory)
- [ ] Create `src/hooks.server.ts` (session refresh on every request)
- [ ] Set up `.env.local` and `.env.example`
- [ ] Confirm Supabase project exists (or create one)

### 1.5 Supabase Local Dev Setup

- [ ] Install Supabase CLI
- [ ] `supabase/config.toml` configured
- [ ] Initial migration file created with profiles table + RLS
- [ ] `supabase/seed.sql` with test users (ADMIN, STAFF, GUEST x all positions)

### 1.6 Directory Structure

- [ ] Create all placeholder directories per ARCHITECTURE.md §3
- [ ] Add `.gitkeep` files to empty directories
- [ ] Verify `$lib` imports resolve correctly

### 1.7 Code Quality Tools

- [ ] ESLint configured (`eslint.config.js` or `.eslintrc.cjs`)
- [ ] Prettier configured (`.prettierrc`)
- [ ] `bun run check` (svelte-check) passes
- [ ] `bun run lint` passes
- [ ] `bun run format` formats correctly
- [ ] Husky + lint-staged pre-commit hook (optional but recommended)

### 1.8 Git & GitHub Setup

- [ ] `git init` + initial commit
- [ ] `.gitignore` configured (node_modules, .env.local, .svelte-kit, dist)
- [ ] GitHub repository created
- [ ] `main` branch protected (require PR + CI pass)

### 1.9 CI/CD Pipeline

- [ ] `.github/workflows/ci.yml` — runs on every PR:
  - `bun install`
  - `bun run check`
  - `bun run lint`
  - `bun run test` (empty test suite passes)
- [ ] `.github/workflows/deploy.yml` — runs on merge to main:
  - Triggers Vercel production deploy via CLI or webhook
- [ ] Vercel project created and linked
- [ ] Preview deployments enabled for PRs

**Phase 1 Exit Criteria:**

- `bun run dev` runs locally
- `bun run build` succeeds with zero errors
- `bun run check` passes with zero TS errors
- CI pipeline passes on GitHub
- Vercel preview deploy works on a test PR

---

## Phase 2 — Authentication & Layout Shell

**Goal:** Complete, working authentication flow. The app shell (sidebar, topnav) renders for authenticated users.

**Estimated effort:** 2–3 days

### 2.1 Authentication Pages

- [ ] `/login` page — email/password form
- [ ] Supabase `signInWithPassword` on form action
- [ ] Error handling (invalid credentials, network error)
- [ ] Redirect to `/dashboard` on success
- [ ] `/logout` server route — calls `signOut`, redirects to `/login`
- [ ] Supabase magic link support (optional at this phase)
- [ ] `/api/auth/callback` route for OAuth/magic link exchange

### 2.2 Route Guards

- [ ] Root `+layout.server.ts` — loads session; redirects unauthenticated users to `/login`
- [ ] `(app)` group layout guard — redirects if no session
- [ ] `(admin)` group layout guard — returns 403 if role !== ADMIN
- [ ] `locals.user` typed correctly in `app.d.ts`

### 2.3 User Profile

- [ ] Supabase trigger: auto-create `profiles` row on `auth.users` insert
- [ ] Profile loaded in root layout; available to all child routes
- [ ] `locals.user` includes: `id`, `email`, `full_name`, `role`, `position`

### 2.4 App Shell Layout

- [ ] `(app)/+layout.svelte` — renders sidebar + topnav + main content slot
- [ ] `Sidebar.svelte` — navigation links for all modules
  - Active state highlighted
  - Role-filtered (admin section hidden from STAFF/GUEST)
  - Responsive (collapses to icon-only on mobile)
- [ ] `TopNav.svelte` — page title, user avatar, sign-out button
- [ ] Mobile drawer pattern for sidebar

### 2.5 Dashboard Page (Stub)

- [ ] `/dashboard` — authenticated landing page
- [ ] Shows: welcome message, user name, role badge, position tag
- [ ] Module cards grid (links only, no data yet)
- [ ] Responsive layout

### 2.6 Design System Components (Core Set)

- [ ] `Button.svelte` (variants: primary, secondary, ghost, danger; sizes: sm, md, lg)
- [ ] `Input.svelte` (text, email, password; error state)
- [ ] `Card.svelte` (with slot for header, body, footer)
- [ ] `Badge.svelte` (role and status variants)
- [ ] `Spinner.svelte`
- [ ] `Toast.svelte` + toast store for notifications
- [ ] `Avatar.svelte`

**Phase 2 Exit Criteria:**

- Login → dashboard flow works end-to-end
- Unauthenticated users cannot access `/dashboard`
- Non-admin users cannot access `/admin/*`
- App shell renders correctly at all breakpoints
- All core UI components render in isolation

---

## Phase 3 — Database Schema & Core Services

**Goal:** Complete database schema with RLS. Server-side service layer that all future modules will use.

**Estimated effort:** 2–3 days

### 3.1 Full Schema Migration

- [ ] All tables from ARCHITECTURE.md §5 created in a single migration
- [ ] All foreign keys defined
- [ ] All enums defined
- [ ] All indexes created (user_id, module_id, created_at)
- [ ] `updated_at` auto-update triggers

### 3.2 Row Level Security Policies

- [ ] `profiles` — users can read own row; admins can read/write all
- [ ] `modules` — all authenticated users can read published modules
- [ ] `content_items` — authenticated users can read items matching their position
- [ ] `progress` — users can read/write own progress; admins can read all
- [ ] `points` — users can read own points; server role writes
- [ ] `badges`, `user_badges` — all authenticated users can read; server role writes
- [ ] `certificates` — users read own; admins read all; server role writes
- [ ] `audit_logs` — admins read; server role writes; no user writes

### 3.3 Supabase Type Generation

- [ ] `bun run db:types` script configured in package.json
- [ ] `src/lib/types/database.types.ts` generated and committed
- [ ] Script documented in README

### 3.4 Server Services Layer

- [ ] `src/lib/server/auth.ts` — `requireAuth()`, `requireRole()` helpers
- [ ] `src/lib/server/services/users.ts` — CRUD for profiles
- [ ] `src/lib/server/services/content.ts` — module + content item queries
- [ ] `src/lib/server/services/progress.ts` — progress tracking
- [ ] `src/lib/server/services/points.ts` — points ledger
- [ ] `src/lib/server/services/certificates.ts` — certificate issuance
- [ ] `src/lib/server/services/reports.ts` — aggregate queries

### 3.5 Seed Data

- [ ] `supabase/seed.sql` — 1 ADMIN, 3 STAFF (one per position), 1 GUEST
- [ ] Sample modules (one per core module slug)
- [ ] Sample content items per module
- [ ] Sample progress, points, badges for demo users

**Phase 3 Exit Criteria:**

- All tables exist with correct schema
- RLS blocks unauthorized access when tested via anon client
- TypeScript types generated successfully
- Service functions return typed data without errors
- Seed data loads successfully

---

## Phase 4 — Core Business Modules (Part 1)

**Goal:** Implement the learning content modules. Users can browse, access, and complete learning content.

**Estimated effort:** 5–7 days

### Modules in this phase:

1. **Growth Journey** — structured learning paths
2. **Product Knowledge** — product catalog learning content
3. **Fresh Update** — news and announcements
4. **Content Map** — visual overview of all available content

### Per-module work:

- [ ] Database queries in service layer
- [ ] `+page.server.ts` load function
- [ ] List page (module index)
- [ ] Detail page (content item view)
- [ ] Video player / document viewer / article renderer
- [ ] Progress tracking (mark as started, mark as complete)
- [ ] Position-based content filtering
- [ ] Responsive layout

**Phase 4 Exit Criteria:**

- STAFF user can browse and complete content in all 4 modules
- Progress is saved to database
- Position filter works correctly
- All pages render at mobile, tablet, desktop

---

## Phase 5 — Core Business Modules (Part 2)

**Goal:** Implement interactive and assessment modules.

**Estimated effort:** 5–7 days

### Modules in this phase:

5. **Play & Learn** — gamified learning exercises
6. **Tanya Jawab** — Q&A / forum
7. **Let's Practice** — assessments and practice scenarios

### Per-module work:

- [ ] Quiz engine (multiple choice, short answer)
- [ ] Score calculation and storage
- [ ] Forum/Q&A threads (create, reply, mark as answered)
- [ ] Practice scenario player
- [ ] All CRUD operations with RLS enforced

---

## Phase 6 — Rewards & Gamification

**Goal:** Points, badges, and certificates working end-to-end.

**Estimated effort:** 3–4 days

### Modules in this phase:

8. **Points** — earn points for completing content, quizzes, etc.
9. **Badges** — earn badges for milestones
10. **Certificates** — generate and download certificates

### Work:

- [ ] Points awarded automatically on content completion (Supabase function/trigger)
- [ ] Badge criteria engine (rule-based, checks progress milestones)
- [ ] Certificate PDF generation (html-pdf-node or Supabase Edge Function)
- [ ] Certificate stored in Supabase Storage
- [ ] User-facing points history, badge gallery, certificate download

---

## Phase 7 — Admin, Reports & Operations

**Goal:** Admin panel, reporting, team management, backup, and audit logging.

**Estimated effort:** 5–7 days

### Modules in this phase:

11. **Team & Progress** — manager view of team learning
12. **Reports** — analytics dashboards
13. **Settings** — system configuration, user management
14. **Backup** — data export
15. **Audit Logs** — activity trail

### Work:

- [ ] User management CRUD (admin only)
- [ ] Role/position assignment
- [ ] Leaderboard
- [ ] Module completion reports
- [ ] CSV export for reports
- [ ] Manual backup trigger (exports to Supabase Storage)
- [ ] Audit log viewer with filters
- [ ] System settings (app name, logo, etc.)

---

## Cross-Cutting Concerns (all phases)

These are not phase-specific but must be addressed continuously:

| Concern              | Action                                                              |
| -------------------- | ------------------------------------------------------------------- |
| Accessibility        | All interactive components keyboard-navigable; ARIA labels on icons |
| Error boundaries     | `+error.svelte` at route group level                                |
| Loading states       | Skeletons on data-dependent sections                                |
| Empty states         | Illustrated empty state for every list view                         |
| Offline / error      | Graceful degradation if Supabase is unreachable                     |
| Internationalisation | Indonesian as primary language; English labels in code              |
| Mobile experience    | Test every page at 375px width                                      |
| Performance          | Server-side rendering for all initial page loads                    |

---

## Recommended Implementation Order Summary

```
Phase 0  ✅  Audit & Architecture              (complete)
Phase 1      Scaffold & Foundation              (start here)
Phase 2      Auth & Layout Shell
Phase 3      Database Schema & Services
Phase 4      Content Modules (browse + complete)
Phase 5      Interactive Modules (quizzes + Q&A)
Phase 6      Rewards (points, badges, certs)
Phase 7      Admin, Reports, Operations
```

---

## Risk Register

| Risk                                            | Phase | Mitigation                                                      |
| ----------------------------------------------- | ----- | --------------------------------------------------------------- |
| Supabase RLS misconfiguration causing data leak | 3     | Review every policy before seeding prod data                    |
| Certificate PDF generation on Vercel limits     | 6     | Use Supabase Edge Function or external service                  |
| Large media files slowing build                 | 4     | Use Supabase Storage CDN URLs; never embed in repo              |
| Quiz state complexity                           | 5     | Keep quiz state server-side; avoid complex Svelte stores        |
| Vercel function timeout on reports              | 7     | Pre-aggregate data with Postgres functions + materialized views |
| Bun / SvelteKit edge case incompatibilities     | 1     | Run `bun run build` daily during scaffold phase                 |

---

## Definition of Done (per feature)

A feature is done when:

1. ✅ The feature works correctly in the browser
2. ✅ `bun run check` passes (zero TypeScript errors)
3. ✅ `bun run lint` passes
4. ✅ `bun run build` succeeds
5. ✅ The feature works at mobile (375px), tablet (768px), and desktop (1280px)
6. ✅ RLS is verified for the feature's data
7. ✅ Error and empty states are handled
8. ✅ The feature is merged via PR with CI passing
