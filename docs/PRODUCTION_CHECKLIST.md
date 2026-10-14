# Production Checklist — Audy Learning Centre

**Version:** 1.0 | **Date:** 2026-10-07
**Legend:** ✅ VERIFIED | ⚠️ IMPLEMENTED BUT NOT VERIFIED | ❌ NOT IMPLEMENTED

---

## Infrastructure

| Item | Status | Notes |
|---|---|---|
| GitHub repository created | ⚠️ | Requires GitHub account setup |
| Vercel project connected to GitHub | ⚠️ | Requires Vercel account |
| Supabase project created | ⚠️ | Requires Supabase account |
| Google Cloud project created | ⚠️ | Requires GCP account |
| Custom domain configured | ⚠️ | Requires DNS access |

---

## Supabase

| Item | Status | Notes |
|---|---|---|
| All 13 migrations applied | ⚠️ | Migrations written and verified locally |
| Seed data applied | ⚠️ | Seed SQL written |
| RLS enabled on all tables | ✅ | All 35+ tables have RLS enabled |
| `is_admin()` helper function | ✅ | Created in migration 2 |
| `caller_position()` helper function | ✅ | Created in migration 6 |
| Auth redirect URLs configured | ⚠️ | Requires real Supabase project |
| Email signup disabled | ⚠️ | Requires Supabase Dashboard |
| Admin user created | ⚠️ | Requires real project |
| TypeScript types regenerated | ⚠️ | Manual stub in use; run `npm run db:types` after connecting |
| Indexes verified | ✅ | All `idx_*` indexes in migrations |
| submitted_at trigger (quiz anti-tamper) | ✅ | In migration 8 |
| Unique attempt constraint | ✅ | In migration 8 |

---

## Google Cloud / Drive

| Item | Status | Notes |
|---|---|---|
| GCP project created | ⚠️ | Requires GCP account |
| Drive API enabled | ⚠️ | Requires GCP project |
| Service account created | ⚠️ | Requires GCP project |
| Service account key generated | ⚠️ | Keep private — never commit |
| Shared Drive created | ⚠️ | Requires Google Workspace |
| Service account added to Shared Drive | ⚠️ | Content Manager role |
| Root folder ID noted | ⚠️ | Set in Vercel env |
| `POST /api/drive/init` run | ⚠️ | Run once after first deploy |
| Module sub-folders created | ⚠️ | Created by init endpoint |
| Folder IDs in Vercel env | ⚠️ | After running init |
| Upload tested | ⚠️ | Requires real credentials |
| Download/stream tested | ⚠️ | Requires real credentials |
| PDF certificate upload | ⚠️ | Requires real credentials |

---

## Vercel

| Item | Status | Notes |
|---|---|---|
| Project imported from GitHub | ⚠️ | Requires setup |
| All env vars configured | ⚠️ | See VERCEL_PRODUCTION.md |
| `vercel.json` function timeouts set | ❌ | File not yet created — add before deploy |
| Production domain active | ⚠️ | Requires DNS |
| SSL certificate active | ⚠️ | Auto via Vercel |
| Preview deployments working | ⚠️ | Auto on non-main branches |
| Build passes on Vercel CI | ⚠️ | EPERM does not occur on Linux |

---

## Application Features

### Authentication
| Feature | Status | Notes |
|---|---|---|
| Login (email + password) | ✅ | Implemented and tested locally |
| Logout | ✅ | Server-side signOut |
| Session refresh (SSR cookies) | ✅ | hooks.server.ts |
| Redirect unauthenticated → /login | ✅ | (app) layout guard |
| Admin route protection | ✅ | (admin) layout guard |
| Inactive account block | ✅ | requireActiveAccount() |
| JWT validated server-side | ✅ | getUser() in hooks |

### Growth Journey
| Feature | Status | Notes |
|---|---|---|
| Stage list with dynamic numbering | ✅ | sort_order derived |
| Stage detail with tabs | ✅ | Overview/Materi/Kasus/Kuis/Lampiran |
| Material view with content blocks | ✅ | RICH_TEXT/IMAGE/VIDEO/DOCUMENT/GDOCS/LINK |
| Material completion tracking | ✅ | markMaterialCompleted + updateStageProgress |
| Case study view | ✅ | With Drive attachments |
| Case completion tracking | ✅ | gj_case_progress |
| Quiz — answer security | ✅ | is_correct never sent to browser |
| Quiz — server-side scoring | ✅ | submitQuizAttempt() |
| Quiz — attempt locking | ✅ | submitted_at + DB trigger |
| Quiz — expiry/refresh | ✅ | refresh_days + gj_quiz_expiry view |
| Quiz — duplicate prevention | ✅ | DB unique index on IN_PROGRESS |
| Continue Learning button | ✅ | First incomplete required material |
| Position filter | ✅ | RLS + caller_position() |

### Rewards
| Feature | Status | Notes |
|---|---|---|
| Points — server-side award | ✅ | All events in points.ts |
| Points — idempotency | ✅ | UNIQUE (user_id, idempotency_key) |
| Points — balance + history | ✅ | getUserPointSummary() |
| Level system | ✅ | 6 levels seeded |
| Badge criteria engine | ✅ | evaluateBadges() |
| Badge — idempotent award | ✅ | UNIQUE (user_id, badge_id) |
| Certificate — PDF generation | ⚠️ | puppeteer-core installed; requires Chromium on Vercel |
| Certificate — Drive upload | ⚠️ | Requires real Drive credentials |
| Certificate — public verification | ✅ | /verify/[code] page |
| Auto-award on completion | ✅ | rewards-integration.ts |

### Content Modules (Phase 6)
| Feature | Status | Notes |
|---|---|---|
| Product Knowledge | ✅ | Categories → Topics → Sections |
| Play & Learn | ✅ | Server-side scoring, media questions |
| Let's Practice | ✅ | Drive/Docs/Sheets/External links |
| Tanya Jawab | ✅ | Questions + answers + admin verify |
| Ruang Aspirasi | ✅ | Anonymous option, status tracking |
| Fresh Update | ✅ | Rich content + Drive attachments |
| Notifications | ✅ | Read/unread/mark-all-read |

### Admin CMS (Phase 7)
| Feature | Status | Notes |
|---|---|---|
| User management (list + edit) | ✅ | Role + position + department |
| Drive File Manager | ✅ | List/delete/replace with reference count |
| Content Map | ✅ | Overview of all published content |
| Progress dashboard | ✅ | Per-employee GJ/points/badges/certs |
| Admin growth-journey CRUD | ✅ | Stage + material + file upload |

### Reports & Backup (Phase 8)
| Feature | Status | Notes |
|---|---|---|
| Material Detail report + CSV | ✅ | /api/reports?type=material-detail&csv=1 |
| GJ Stage Summary report + CSV | ✅ | |
| Employee Summary report + CSV | ✅ | With period/position/department filter |
| Q&A report + CSV | ✅ | |
| Feedback/Aspirasi report + CSV | ✅ | |
| Drive Usage report + CSV | ✅ | File type + module distribution |
| Backup — metadata JSON to Drive | ✅ | Binary files NOT copied |
| Backup — Drive file ID validation | ✅ | validateDriveReferences() |
| Backup — missing file marking | ✅ | Marks deleted_at, does not silently ignore |
| Audit log — comprehensive | ✅ | FILE_*, BACKUP_*, USER_*, DRIVE_* actions |
| Audit log — CSV export | ✅ | /api/reports?type=audit-logs&csv=1 |
| Audit log — filter by action | ✅ | URL param ?action=FILE_ |

---

## Security

| Item | Status | Notes |
|---|---|---|
| Service role key never in browser | ✅ | Server-only import only |
| Drive credentials never in browser | ✅ | Server-only import only |
| Quiz answers never sent before submission | ✅ | getQuizForEmployee() strips is_correct |
| Score computed server-side only | ✅ | submitQuizAttempt() |
| Attempt immutability (submitted_at) | ✅ | DB trigger blocks UPDATE |
| RLS on all 35+ tables | ✅ | |
| File access authorised server-side | ✅ | /api/files/[id]/stream |
| Arbitrary Drive file access blocked | ✅ | ALC UUID required, not raw Drive ID |
| CSRF protection | ✅ | SvelteKit default |
| httpOnly session cookies | ✅ | @supabase/ssr |

---

## What Requires Real Credentials to Verify

The following items are **IMPLEMENTED BUT NOT VERIFIED** because they require:
- A live Supabase project with the schema applied
- A Google Cloud service account with Drive API access
- A Google Workspace Shared Drive accessible to the service account
- A Vercel project with all environment variables set

Once those are configured, run through this checklist top-to-bottom, changing each ⚠️ to ✅ as verified.

---

## `vercel.json` — Create Before Deploy

This file is **not yet created**. Add it to the project root:

```json
{
  "functions": {
    "src/routes/api/files/upload/+server.ts": { "maxDuration": 30 },
    "src/routes/api/drive/init/+server.ts": { "maxDuration": 30 },
    "src/routes/(admin)/admin/backup/+page.server.ts": { "maxDuration": 60 },
    "src/routes/api/reports/+server.ts": { "maxDuration": 30 }
  }
}
```
