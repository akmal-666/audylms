# ARCHITECTURE — AUDY LEARNING CENTRE (ALC)

**Version:** 1.0
**Phase:** 0 — Architecture Definition
**Date:** 2026-10-07

---

## 1. System Overview

Audy Learning Centre (ALC) is a premium corporate Learning Management System (LMS) built for a dental clinic context. It manages staff training, product knowledge, compliance learning, and team performance tracking across three roles.

---

## 2. Technology Stack

### 2.1 Frontend

| Layer           | Technology       | Version | Rationale                                         |
| --------------- | ---------------- | ------- | ------------------------------------------------- |
| Framework       | SvelteKit        | Latest  | SSR + SPA in one framework; minimal client bundle |
| Language        | TypeScript       | ≥ 5.x   | Type safety across server and client              |
| Styling         | Tailwind CSS     | v4.x    | Utility-first; pairs cleanly with Svelte          |
| Component model | Svelte 5 (runes) | Latest  | Reactive, compiled, no virtual DOM overhead       |

### 2.2 Backend

| Layer           | Technology           | Rationale                             |
| --------------- | -------------------- | ------------------------------------- |
| Server routes   | SvelteKit +server.ts | Co-located API with the frontend      |
| Server logic    | SvelteKit load()     | SSR data loading, streaming           |
| Auth middleware | hooks.server.ts      | Session validation on every request   |
| Services layer  | Plain TS modules     | Thin wrappers around Supabase queries |

### 2.3 Database & Auth

| Layer            | Technology          | Notes                                       |
| ---------------- | ------------------- | ------------------------------------------- |
| Database         | Supabase PostgreSQL | Managed Postgres; RLS enabled               |
| Auth             | Supabase Auth       | Email/password + magic link; JWT sessions   |
| Session handling | @supabase/ssr       | Cookie-based sessions for SSR compatibility |
| Storage          | Supabase Storage    | Media, documents, certificates              |
| Type generation  | supabase gen types  | Auto-generated TS types from DB schema      |

### 2.4 Runtime & Tooling

| Tool        | Technology            | Version |
| ----------- | --------------------- | ------- |
| Runtime     | Bun                   | 1.3.11  |
| Test runner | Vitest                | Latest  |
| E2E tests   | Playwright            | Latest  |
| Linter      | ESLint + svelte-check | Latest  |
| Formatter   | Prettier              | Latest  |

### 2.5 Infrastructure

| Layer      | Technology               |
| ---------- | ------------------------ |
| Hosting    | Vercel                   |
| Adapter    | @sveltejs/adapter-vercel |
| CDN        | Vercel Edge Network      |
| Repository | GitHub                   |
| CI/CD      | GitHub Actions           |

---

## 3. Project Directory Structure

```
audy-lms/
├── .github/
│   └── workflows/
│       ├── ci.yml                  # typecheck, lint, test on PR
│       └── deploy.yml              # deploy to Vercel on main merge
├── docs/
│   ├── ARCHITECTURE.md
│   ├── PROJECT_AUDIT.md
│   └── DEVELOPMENT_PLAN.md
├── src/
│   ├── app.html                    # HTML shell
│   ├── app.css                     # Global styles, Tailwind directives
│   ├── app.d.ts                    # Global TypeScript declarations
│   │
│   ├── lib/
│   │   ├── components/             # Reusable Svelte components
│   │   │   ├── ui/                 # Primitive UI components
│   │   │   │   ├── Button.svelte
│   │   │   │   ├── Input.svelte
│   │   │   │   ├── Modal.svelte
│   │   │   │   ├── Badge.svelte
│   │   │   │   ├── Card.svelte
│   │   │   │   ├── Avatar.svelte
│   │   │   │   ├── Table.svelte
│   │   │   │   ├── Tabs.svelte
│   │   │   │   ├── Toast.svelte
│   │   │   │   ├── Progress.svelte
│   │   │   │   └── Spinner.svelte
│   │   │   ├── layout/             # Layout structure components
│   │   │   │   ├── Sidebar.svelte
│   │   │   │   ├── TopNav.svelte
│   │   │   │   ├── PageHeader.svelte
│   │   │   │   └── Footer.svelte
│   │   │   └── shared/             # Domain-aware shared components
│   │   │       ├── UserAvatar.svelte
│   │   │       ├── RoleBadge.svelte
│   │   │       └── PositionTag.svelte
│   │   │
│   │   ├── server/                 # Server-only modules (never imported client-side)
│   │   │   ├── supabase.ts         # Server Supabase client factory
│   │   │   ├── auth.ts             # Auth helpers (getSession, requireRole)
│   │   │   └── services/           # Business logic services
│   │   │       ├── users.ts
│   │   │       ├── content.ts
│   │   │       ├── points.ts
│   │   │       ├── certificates.ts
│   │   │       └── reports.ts
│   │   │
│   │   ├── supabase/               # Supabase shared (client + server safe)
│   │   │   ├── client.ts           # Browser Supabase client (singleton)
│   │   │   └── types.ts            # Re-export of generated DB types
│   │   │
│   │   ├── stores/                 # Svelte stores / rune-based state
│   │   │   ├── auth.ts             # Current user, session
│   │   │   └── ui.ts               # Toast notifications, sidebar state
│   │   │
│   │   ├── types/                  # Shared TypeScript types
│   │   │   ├── database.types.ts   # Generated by supabase gen types
│   │   │   ├── auth.types.ts       # Role, Position enums + user profile
│   │   │   └── app.types.ts        # Module-specific types
│   │   │
│   │   └── utils/                  # Pure utility functions
│   │       ├── dates.ts
│   │       ├── strings.ts
│   │       └── errors.ts
│   │
│   ├── routes/
│   │   ├── +layout.server.ts       # Root: session load, redirect unauthenticated
│   │   ├── +layout.svelte          # Root: font, global styles
│   │   │
│   │   ├── (auth)/                 # Public auth group (no sidebar)
│   │   │   ├── +layout.svelte
│   │   │   ├── login/
│   │   │   │   ├── +page.svelte
│   │   │   │   └── +page.server.ts
│   │   │   └── logout/
│   │   │       └── +page.server.ts
│   │   │
│   │   ├── (app)/                  # Authenticated app shell
│   │   │   ├── +layout.server.ts   # Guard: require session
│   │   │   ├── +layout.svelte      # App shell: sidebar + topnav
│   │   │   ├── dashboard/
│   │   │   │   └── +page.svelte
│   │   │   ├── growth-journey/     # Module: Growth Journey
│   │   │   ├── product-knowledge/  # Module: Product Knowledge
│   │   │   ├── play-learn/         # Module: Play & Learn
│   │   │   ├── tanya-jawab/        # Module: Tanya Jawab (Q&A)
│   │   │   ├── lets-practice/      # Module: Let's Practice
│   │   │   ├── fresh-update/       # Module: Fresh Update
│   │   │   ├── points/             # Module: Points
│   │   │   ├── badges/             # Module: Badges
│   │   │   ├── certificates/       # Module: Certificates
│   │   │   ├── team/               # Module: Team & Progress
│   │   │   └── content-map/        # Module: Content Map
│   │   │
│   │   ├── (admin)/                # Admin-only group
│   │   │   ├── +layout.server.ts   # Guard: require ADMIN role
│   │   │   ├── +layout.svelte
│   │   │   ├── reports/            # Module: Reports
│   │   │   ├── settings/           # Module: Settings
│   │   │   ├── backup/             # Module: Backup
│   │   │   └── audit-logs/         # Module: Audit Logs
│   │   │
│   │   └── api/                    # API-only routes (no UI)
│   │       ├── auth/
│   │       │   └── callback/
│   │       │       └── +server.ts  # Supabase OAuth/magic-link callback
│   │       └── webhooks/
│   │           └── +server.ts      # (reserved for future integrations)
│   │
│   └── hooks.server.ts             # Request lifecycle: session refresh
│
├── static/
│   ├── favicon.png
│   ├── logo.svg
│   └── fonts/                      # Self-hosted fonts if needed
│
├── tests/
│   ├── unit/                       # Vitest unit tests
│   └── e2e/                        # Playwright E2E tests
│
├── supabase/
│   ├── migrations/                 # SQL migration files
│   │   └── 00001_initial_schema.sql
│   ├── seed.sql                    # Development seed data
│   └── config.toml                 # Supabase CLI config (local dev)
│
├── .env.example                    # Required env vars (no secrets)
├── .env.local                      # Local secrets (git-ignored)
├── .gitignore
├── .eslintrc.cjs
├── .prettierrc
├── bun.lockb                       # Bun lockfile
├── package.json
├── svelte.config.js
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## 4. Authentication & Authorization Architecture

### 4.1 Session Flow

```
Browser request
    │
    ▼
hooks.server.ts                        ← refreshes Supabase session on every request
    │
    ▼
+layout.server.ts (root)               ← loads session; sets locals.user
    │
    ├─► unauthenticated → redirect /login
    │
    └─► authenticated
            │
            ▼
        (app) +layout.server.ts        ← available to all app pages
            │
            ├─► role = ADMIN   → full access
            ├─► role = STAFF   → standard access
            └─► role = GUEST   → read-only access
                    │
                    ▼
                (admin) +layout.server.ts   ← guards admin section
                    │
                    └─► role != ADMIN → 403 redirect
```

### 4.2 Role vs. Position

```
Role (authorization)          Position (content filter)
─────────────────────         ──────────────────────────
ADMIN                         RESEPSIONIS
STAFF                         PERAWAT GIGI
GUEST                         SUPERVISOR

Role controls: what you CAN DO (CRUD permissions, admin access)
Position controls: what CONTENT you SEE (curriculum filtering)
```

Both are columns on the `profiles` table. They are independent.

### 4.3 Row Level Security

All Supabase tables will have RLS enabled from creation. Default policy: deny everything. Explicit policies added per table per operation.

---

## 5. Database Schema (Initial Design)

### 5.1 Core Tables

```sql
-- User profiles (extends Supabase auth.users)
profiles
  id          uuid PK → auth.users.id
  full_name   text
  email       text
  role        enum('ADMIN', 'STAFF', 'GUEST')
  position    enum('RESEPSIONIS', 'PERAWAT_GIGI', 'SUPERVISOR')
  avatar_url  text
  is_active   boolean DEFAULT true
  created_at  timestamptz
  updated_at  timestamptz

-- Content modules
modules
  id           uuid PK
  slug         text UNIQUE
  title        text
  description  text
  icon         text
  sort_order   int
  is_published boolean
  positions    text[]    -- position-based filter
  created_at   timestamptz

-- Learning content items
content_items
  id           uuid PK
  module_id    uuid → modules.id
  title        text
  content_type enum('VIDEO', 'DOCUMENT', 'QUIZ', 'ARTICLE')
  content_url  text
  duration_sec int
  sort_order   int
  is_published boolean
  positions    text[]
  created_at   timestamptz

-- User progress
progress
  id              uuid PK
  user_id         uuid → profiles.id
  content_item_id uuid → content_items.id
  status          enum('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')
  score           int
  completed_at    timestamptz
  created_at      timestamptz
  UNIQUE(user_id, content_item_id)

-- Points ledger
points
  id          uuid PK
  user_id     uuid → profiles.id
  amount      int
  reason      text
  reference_id uuid   -- content_item_id, badge_id, etc.
  created_at  timestamptz

-- Badges
badges
  id           uuid PK
  title        text
  description  text
  image_url    text
  criteria     jsonb
  created_at   timestamptz

-- User badges
user_badges
  id         uuid PK
  user_id    uuid → profiles.id
  badge_id   uuid → badges.id
  awarded_at timestamptz
  UNIQUE(user_id, badge_id)

-- Certificates
certificates
  id             uuid PK
  user_id        uuid → profiles.id
  module_id      uuid → modules.id
  issued_at      timestamptz
  certificate_url text
  UNIQUE(user_id, module_id)

-- Audit log
audit_logs
  id          uuid PK
  user_id     uuid → profiles.id
  action      text
  table_name  text
  record_id   uuid
  old_data    jsonb
  new_data    jsonb
  ip_address  text
  created_at  timestamptz
```

---

## 6. Design System Specification

### 6.1 Color Palette

```css
:root {
	/* Brand */
	--color-primary: #1c50a7; /* Deep blue — trust, professionalism */
	--color-secondary: #81baf1; /* Sky blue — calm, open */
	--color-accent: #deb8ce; /* Dusty rose — human, warm */
	--color-highlight: #f2ac44; /* Amber — focus, energy */

	/* Neutrals */
	--color-surface: #ffffff;
	--color-bg: #f8f9fc;
	--color-border: #e4e8ef;
	--color-text: #1a1f2e;
	--color-muted: #6b7280;

	/* Status */
	--color-success: #22c55e;
	--color-warning: #f59e0b;
	--color-error: #ef4444;
	--color-info: #3b82f6;
}
```

### 6.2 Typography

- **Font:** Inter (Google Fonts or self-hosted)
- **Base size:** 16px
- **Scale:** Tailwind default (xs through 4xl)
- **Heading weight:** 600–700
- **Body weight:** 400–500

### 6.3 Spacing

Tailwind 4px base grid. No custom spacing tokens needed initially.

### 6.4 Border Radius

```
sm: 4px   (inputs, chips)
md: 8px   (cards, buttons)
lg: 12px  (modals, panels)
xl: 16px  (page sections)
```

### 6.5 Shadow

Minimal shadows only. Maximum: `shadow-sm` (box-shadow: 0 1px 3px rgba(0,0,0,.08)). No large elevation shadows.

### 6.6 Design Principles

| Principle      | Guidance                                                           |
| -------------- | ------------------------------------------------------------------ |
| Premium        | Generous whitespace, consistent alignment, no visual clutter       |
| Professional   | Subtle animations only, no bounce or spin on functional elements   |
| Human          | Avatar-forward, real names, progress shown as encouragement        |
| Calm           | Low contrast borders, muted backgrounds, no flashing               |
| Playful (mild) | Accent color on rewards (badges, points), subtle confetti on certs |
| Responsive     | Mobile-first, breakpoints at sm(640) md(768) lg(1024) xl(1280)     |

### 6.7 Forbidden Patterns

- No glassmorphism (`backdrop-blur` + opacity backgrounds as primary style)
- No neon/vibrant gradients
- No box-shadow > 24px blur radius
- No childish gamification (no spinning coins, no level-up animations on core screens)
- No generic SaaS hero layouts on internal pages

---

## 7. API Design Principles

All data mutations go through SvelteKit `+page.server.ts` form actions or `+server.ts` endpoints.

### 7.1 Form Actions (preferred for mutations)

```typescript
// src/routes/(app)/growth-journey/+page.server.ts
export const actions = {
	markComplete: async ({ request, locals }) => {
		const session = await locals.requireAuth(); // throws redirect if no session
		// ... service call
	}
};
```

### 7.2 API Routes (for async/JSON endpoints)

```typescript
// src/routes/api/modules/[id]/progress/+server.ts
export const PATCH: RequestHandler = async ({ params, locals, request }) => {
	// ...
};
```

### 7.3 Response Shape (JSON endpoints)

```typescript
// Success
{ data: T, error: null }

// Error
{ data: null, error: { code: string, message: string } }
```

---

## 8. Security Architecture

| Concern             | Approach                                                        |
| ------------------- | --------------------------------------------------------------- |
| Auth token storage  | httpOnly cookie via @supabase/ssr (no localStorage)             |
| Session refresh     | hooks.server.ts on every request                                |
| Authorization       | Server-side role check in layout.server.ts before any data load |
| Database access     | All queries through server-side Supabase client only            |
| RLS                 | All tables have RLS policies; service role key never in browser |
| CSRF                | SvelteKit CSRF protection enabled by default                    |
| File uploads        | Validated server-side (type, size); stored in Supabase Storage  |
| Audit logging       | Trigger-based logging on all sensitive table writes             |
| Environment secrets | Vercel environment variables; never committed to git            |

---

## 9. Environment Variables

### Required Variables

```bash
# .env.example

# Supabase
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-only (never expose to browser)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
PUBLIC_APP_URL=https://your-app.vercel.app
PUBLIC_APP_NAME="Audy Learning Centre"
```

`PUBLIC_` prefix → exposed to the browser (SvelteKit convention).
Non-`PUBLIC_` → server-only.

---

## 10. Deployment Architecture

```
GitHub (main branch)
    │
    ├── Push → GitHub Actions CI
    │             ├── bun install
    │             ├── bun run check   (svelte-check)
    │             ├── bun run lint
    │             └── bun run test
    │
    └── Merge to main → Vercel (auto-deploy)
                          ├── Build: bun run build
                          ├── Adapter: @sveltejs/adapter-vercel
                          ├── Functions: SvelteKit server routes → Vercel Functions
                          └── Static: /static → Vercel CDN

Feature branches → Vercel Preview deployments (auto)
```

---

## 11. Module Architecture Summary

Each core module follows the same pattern:

```
routes/(app)/<module-slug>/
├── +page.server.ts     ← load() fetches data server-side
├── +page.svelte        ← renders with loaded data
├── [id]/
│   ├── +page.server.ts
│   └── +page.svelte
└── +error.svelte       ← module-specific error boundary

lib/server/services/<module>.ts   ← all DB queries for the module
lib/components/<module>/          ← module-specific Svelte components
lib/types/app.types.ts            ← module TypeScript types
supabase/migrations/              ← module DB migrations
```
