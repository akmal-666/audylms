# Vercel Production Deployment — Audy Learning Centre

**Version:** 1.0 | **Status:** IMPLEMENTED BUT NOT VERIFIED (requires Vercel account + domain)

---

## 1. Prerequisites

- GitHub repository created and pushed
- Supabase project created and migrations applied
- Google Cloud project with Drive API enabled
- Service account created with Shared Drive access

---

## 2. Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import Git Repository → select `audy-lms`
3. Framework Preset: **SvelteKit** (auto-detected)
4. Root Directory: `/` (default)
5. Build Command: `npm run build` (or leave as default)
6. Output Directory: `.vercel/output` (auto)

---

## 3. Environment Variables

Configure in Vercel Dashboard → Settings → Environment Variables.

Apply to: **Production**, **Preview**, **Development**

### Required Variables

| Variable | Environment | Secret |
|---|---|---|
| `PUBLIC_SUPABASE_URL` | All | No |
| `PUBLIC_SUPABASE_PUBLISHABLE_KEY` | All | No |
| `PUBLIC_APP_URL` | Each | No |
| `PUBLIC_APP_NAME` | All | No |
| `SUPABASE_SERVICE_ROLE_KEY` | All | **Yes** |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | All | **Yes** |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | All | **Yes** |
| `GOOGLE_DRIVE_ROOT_FOLDER_ID` | All | No |
| `GOOGLE_DRIVE_GROWTH_JOURNEY_FOLDER_ID` | All | No |
| `GOOGLE_DRIVE_PRODUCT_KNOWLEDGE_FOLDER_ID` | All | No |
| `GOOGLE_DRIVE_PLAY_LEARN_FOLDER_ID` | All | No |
| `GOOGLE_DRIVE_LETS_PRACTICE_FOLDER_ID` | All | No |
| `GOOGLE_DRIVE_FRESH_UPDATE_FOLDER_ID` | All | No |
| `GOOGLE_DRIVE_QNA_FOLDER_ID` | All | No |
| `GOOGLE_DRIVE_SYSTEM_FOLDER_ID` | All | No |

### Per-Environment APP_URL

| Environment | PUBLIC_APP_URL |
|---|---|
| Production | `https://alc.audydental.com` |
| Preview | `https://audy-lms-git-main-TEAM.vercel.app` |
| Development | `http://localhost:5173` |

### Private Key Formatting

The `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` must be entered as a single-line string with literal `\n` for newlines:

```
-----BEGIN PRIVATE KEY-----\nMIIEv...rest of key...\n-----END PRIVATE KEY-----\n
```

In Vercel: paste the exact value from the service account JSON file's `private_key` field.

---

## 4. Vercel Function Configuration

Create `vercel.json` in project root:

```json
{
  "functions": {
    "src/routes/api/files/upload/+server.ts": {
      "maxDuration": 30
    },
    "src/routes/api/drive/init/+server.ts": {
      "maxDuration": 30
    },
    "src/routes/(admin)/admin/backup/+page.server.ts": {
      "maxDuration": 60
    },
    "src/routes/(admin)/admin/reports/**": {
      "maxDuration": 30
    }
  }
}
```

**Note:** Certificate PDF generation (puppeteer-core) requires extended timeout — set to 30s minimum.

---

## 5. Domain Configuration

1. Vercel Dashboard → Project → Settings → Domains
2. Add domain: `alc.audydental.com`
3. Add DNS records per Vercel instructions
4. Wait for SSL certificate provisioning (usually < 5 minutes)

Update Supabase Auth → Site URL to match production domain.

---

## 6. Branch Deployments

| Branch | Environment | URL |
|---|---|---|
| `main` | Production | `alc.audydental.com` |
| `develop` | Preview | Auto-generated |
| Feature branches | Preview | Auto-generated |

**Recommended workflow:**
1. Feature branch → PR to `develop`
2. Preview deployment auto-created
3. QA on preview URL
4. Merge to `main` → production deploy

---

## 7. Windows Developer Note

`npm run build` on Windows without Developer Mode fails on the Vercel adapter symlink step (`EPERM`). The Vite compilation itself succeeds. On Vercel CI (Linux), this issue does not occur.

**Enable Developer Mode:** Settings → Privacy & Security → For Developers → Developer Mode ON

---

## 8. Deploy & Verify

```bash
# Manual deploy via CLI (optional)
npm install -g vercel
vercel login
vercel --prod
```

After deploy, verify:
- [ ] `/login` page loads
- [ ] Login redirects to `/dashboard`
- [ ] `/api/auth/callback` handles magic link
- [ ] File upload works via `/api/files/upload`
- [ ] Certificate generation works

---

## 9. Rollback

Vercel keeps all previous deployments. To rollback:
1. Vercel Dashboard → Deployments
2. Find last known-good deployment
3. Click "..." → "Promote to Production"
