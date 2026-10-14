# Supabase Production Setup — Audy Learning Centre

**Version:** 1.0 | **Status:** IMPLEMENTED BUT NOT VERIFIED (requires real Supabase project)

---

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Organisation: your clinic org
3. Project name: `audy-lms`
4. Region: Southeast Asia (Singapore) — closest to clinic
5. Database password: generate strong password, store in password manager

---

## 2. Run Migrations

Apply all migrations in order:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Push all migrations
supabase db push
```

Migrations to apply (in order):

| File | Content |
|---|---|
| `20261007000001_initial_schema.sql` | Core tables: profiles, departments, positions, system_settings, audit_logs |
| `20261007000002_rls_policies.sql` | RLS + is_admin() helper + base policies |
| `20261007000003_drive_files.sql` | drive_files, material_attachments |
| `20261007000004_drive_rls.sql` | RLS for drive tables |
| `20261007000005_growth_journey.sql` | All GJ tables + enums |
| `20261007000006_growth_journey_rls.sql` | GJ RLS + position filter |
| `20261007000007_assessment_engine.sql` | Quiz versioning, attempt locking, case attachments |
| `20261007000008_assessment_rls.sql` | Assessment RLS + trigger |
| `20261007000009_rewards.sql` | Points, badges, levels, certificates |
| `20261007000010_rewards_rls.sql` | Rewards RLS |
| `20261007000011_content_modules.sql` | PK, Play & Learn, Lets Practice, QnA, Aspirasi, Fresh Update, Notifications |
| `20261007000012_content_modules_rls.sql` | All module RLS |
| `20261007000013_backup_reports.sql` | backup_jobs table |

---

## 3. Seed Initial Data

```bash
supabase db seed --file supabase/seed.sql
```

Seeds: departments, positions, system settings, point rules, levels, badges, certificate template, GJ stages.

---

## 4. Create Admin User

```bash
# Via Supabase CLI
supabase auth admin createuser \
  --email admin@audydental.com \
  --password "SecurePass123!" \
  --email-confirm
```

Then set role to ADMIN:
```sql
UPDATE profiles
SET role = 'ADMIN',
    full_name = 'Admin ALC',
    employee_code = 'ALC-001'
WHERE email = 'admin@audydental.com';
```

---

## 5. Authentication Configuration

In Supabase Dashboard → Authentication → Settings:

| Setting | Value |
|---|---|
| Site URL | `https://your-app.vercel.app` |
| Redirect URLs | `https://your-app.vercel.app/api/auth/callback` |
| Enable email signups | **OFF** (admin creates users only) |
| Enable email confirmations | OFF (internal tool) |
| JWT expiry | 3600 |
| Refresh token rotation | ON |

---

## 6. Environment Variables (for Vercel)

```
PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...  (anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...        (service_role key — KEEP SECRET)
```

Find these in: Supabase Dashboard → Settings → API

---

## 7. Security Checklist

| Check | Status |
|---|---|
| RLS enabled on all tables | IMPLEMENTED |
| is_admin() function created | IMPLEMENTED |
| caller_position() function created | IMPLEMENTED |
| Service role key never in browser | IMPLEMENTED |
| Anon key used for browser client | IMPLEMENTED |
| Session validated server-side via getUser() | IMPLEMENTED |
| submitted_at immutability trigger on quiz attempts | IMPLEMENTED |

---

## 8. Generate TypeScript Types

After applying migrations, regenerate DB types:

```bash
npm run db:types
# Which runs: supabase gen types typescript --local > src/lib/types/database.types.ts
```

**Note:** The current `database.types.ts` is a manually maintained stub that mirrors the full schema. Replace it with the generated version after connecting the real project.

---

## 9. Indexes Verification

Key indexes to verify after migration:

```sql
-- Run in Supabase SQL Editor
SELECT tablename, indexname FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

Expected: All `idx_*` indexes from migrations 1, 5, 7, 9, 11.

---

## 10. Troubleshooting

**RLS blocking admin queries**
- Verify `is_admin()` function exists and returns true for your user
- Check profile row has `role = 'ADMIN'` and `is_active = true`

**Session not persisting**
- Verify `@supabase/ssr` cookie config in `hooks.server.ts`
- Ensure `filterSerializedResponseHeaders` includes `content-range`

**Migration fails**
- Check migration order — each migration depends on previous ones
- Run `supabase db reset` on local, then `db push` for production
