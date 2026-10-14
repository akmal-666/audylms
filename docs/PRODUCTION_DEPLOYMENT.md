# Production Deployment Guide — Audy Learning Centre

**Version:** 1.0 | **Date:** 2026-10-07

---

## Overview

ALC is deployed on:

```
GitHub (source)
    ↓ push to main
Vercel (hosting, CI/CD)
    ↓ SvelteKit SSR
Supabase (PostgreSQL + Auth + RLS)
Google Drive (file storage via Service Account)
```

---

## Pre-Deployment Checklist

### 1. Repository

- [ ] All phases committed to `main`
- [ ] No secrets in git history
- [ ] `.env.local` in `.gitignore` ✅
- [ ] `bun.lock` / `package-lock.json` committed
- [ ] GitHub Actions CI passes

### 2. Supabase

- [ ] Project created in `ap-southeast-1` region
- [ ] All 13 migrations applied (`supabase db push`)
- [ ] Seed data applied (`supabase db seed`)
- [ ] Admin user created and role set
- [ ] Auth redirect URLs configured
- [ ] Email signup disabled
- [ ] RLS verified on all tables
- [ ] `supabase gen types typescript --local` run and committed

### 3. Google Cloud / Drive

- [ ] GCP project created
- [ ] Drive API enabled
- [ ] Service account created + key downloaded
- [ ] Service account added to Shared Drive as Content Manager
- [ ] Root folder ID noted
- [ ] `POST /api/drive/init` called to create sub-folders
- [ ] All folder IDs noted and configured in Vercel env

### 4. Vercel

- [ ] Project imported from GitHub
- [ ] All environment variables configured
- [ ] `vercel.json` function timeouts set
- [ ] Domain configured and SSL active
- [ ] Production URL set as `PUBLIC_APP_URL`
- [ ] Supabase Site URL updated to production URL

---

## Deployment Steps

### Step 1 — Supabase

```bash
supabase link --project-ref YOUR_REF
supabase db push
supabase db seed --file supabase/seed.sql
```

Create admin user (Supabase Dashboard → Auth → Users → Add User), then:
```sql
UPDATE profiles SET role = 'ADMIN', full_name = 'Admin' WHERE email = 'admin@yourcompany.com';
```

### Step 2 — Google Drive Setup

```bash
# Run once after Vercel deploy (requires admin session)
curl -X POST https://alc.yourcompany.com/api/drive/init \
  -H "Cookie: your-session-cookie-here"
```

Copy returned folder IDs to Vercel environment variables.

### Step 3 — Vercel Deploy

```bash
git push origin main
# Vercel auto-deploys on push
```

Or manually: Vercel Dashboard → Project → Deployments → Redeploy.

### Step 4 — Post-Deploy Verification

Run through the Production Checklist (`docs/PRODUCTION_CHECKLIST.md`).

---

## Environment Summary

| Service | Tier | Region | Notes |
|---|---|---|---|
| Vercel | Hobby/Pro | Global CDN | Auto-scales |
| Supabase | Free/Pro | ap-southeast-1 | 500MB free |
| Google Drive | Workspace | — | Shared Drive |
| GitHub | Free | — | Source control |

---

## Monitoring

- **Vercel:** Dashboard → Functions tab for invocation counts and errors
- **Supabase:** Dashboard → Logs for DB query logs and auth events
- **Errors:** Check Vercel Runtime Logs under Deployments → Functions

---

## Security Notes

1. `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — never expose to browser
2. `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` — never log or expose
3. All Drive API calls happen server-side only
4. Quiz correct answers never sent to browser before submission
5. Audit logs track all administrative actions
