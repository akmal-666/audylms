# Deploy Guide — Audy Learning Centre

**Versi:** 1.0  
**Stack:** SvelteKit · Supabase · Google Drive · Vercel  
**Waktu estimasi:** 2–3 jam (pertama kali)

---

## Gambaran Proses

```
GitHub          Supabase           Google Cloud          Vercel
  │                │                    │                   │
  1. Push repo     2. Buat project      3. Buat SA          4. Import repo
  │                3. Jalankan          4. Buat Shared       5. Set env vars
  │                   migrasi              Drive            6. Deploy
  │                4. Seed data         5. Catat folder ID   │
  │                5. Buat admin        │                   7. Init Drive
  └────────────────────────────────────────────────────────→ 8. Test
```

---

## BAGIAN 1 — GitHub

### 1.1 Persiapkan repository

```bash
cd C:\Users\bkhra\Desktop\Audy_LMS

# Inisialisasi git (jika belum)
git init
git add .
git commit -m "chore: initial commit — ALC complete"
```

### 1.2 Push ke GitHub

1. Buka [github.com/new](https://github.com/new)
2. Nama repo: `audy-lms`
3. Visibility: **Private**
4. Jangan centang "Initialize repository"
5. Klik **Create repository**

```bash
git remote add origin https://github.com/YOUR_USERNAME/audy-lms.git
git branch -M main
git push -u origin main
```

### 1.3 Buat branch `develop`

```bash
git checkout -b develop
git push -u origin develop
```

> **Pola kerja:** fitur → PR ke `develop` → review → merge ke `main` → auto deploy ke production.

---

## BAGIAN 2 — Supabase

### 2.1 Buat project

1. Buka [supabase.com](https://supabase.com) → **New project**
2. Nama: `audy-lms`
3. Database password: buat password kuat, simpan di password manager
4. Region: **Southeast Asia (Singapore)**
5. Klik **Create new project** — tunggu ~2 menit

### 2.2 Catat credentials

Buka **Settings → API**:

| Nilai | Variabel |
|---|---|
| Project URL | `PUBLIC_SUPABASE_URL` |
| `anon` / `public` key | `PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| `service_role` key | `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Rahasia |

### 2.3 Install Supabase CLI

```bash
# Windows (via npm)
npm install -g supabase

# Verifikasi
supabase --version
```

### 2.4 Link ke project

```bash
cd C:\Users\bkhra\Desktop\Audy_LMS
supabase login          # buka browser, login
supabase link --project-ref YOUR_PROJECT_REF
# Project ref ada di URL: supabase.com/dashboard/project/YOUR_PROJECT_REF
```

### 2.5 Jalankan semua migrasi

```bash
supabase db push
```

Harus muncul 13 migrasi berhasil:

```
Applied migration 20261007000001_initial_schema.sql
Applied migration 20261007000002_rls_policies.sql
Applied migration 20261007000003_drive_files.sql
Applied migration 20261007000004_drive_rls.sql
Applied migration 20261007000005_growth_journey.sql
Applied migration 20261007000006_growth_journey_rls.sql
Applied migration 20261007000007_assessment_engine.sql
Applied migration 20261007000008_assessment_rls.sql
Applied migration 20261007000009_rewards.sql
Applied migration 20261007000010_rewards_rls.sql
Applied migration 20261007000011_content_modules.sql
Applied migration 20261007000012_content_modules_rls.sql
Applied migration 20261007000013_backup_reports.sql
```

### 2.6 Seed data awal

```bash
supabase db seed --file supabase/seed.sql
```

Seed berisi: departemen, posisi, point rules, level, badges, template sertifikat, 4 stage Growth Journey.

### 2.7 Buat user admin pertama

Di **Supabase Dashboard → Authentication → Users → Add user**:

| Field | Nilai |
|---|---|
| Email | `admin@audydental.com` |
| Password | password kuat |
| Auto Confirm User | ✅ centang |

Kemudian set role ADMIN di **SQL Editor**:

```sql
UPDATE profiles
SET
    role          = 'ADMIN',
    full_name     = 'Admin ALC',
    employee_code = 'ALC-001',
    is_active     = true
WHERE email = 'admin@audydental.com';
```

### 2.8 Konfigurasi Auth

Buka **Authentication → URL Configuration**:

| Setting | Nilai |
|---|---|
| Site URL | `https://alc.audydental.com` (URL production nanti) |
| Redirect URLs | `https://alc.audydental.com/api/auth/callback` |

Buka **Authentication → Providers → Email**:
- Enable Email provider: ✅
- Confirm email: ❌ (matikan — tool internal)
- Enable Sign Ups: ❌ (matikan — admin yang buat user)

### 2.9 Generate TypeScript types (opsional tapi disarankan)

```bash
supabase gen types typescript --linked > src/lib/types/database.types.ts
git add src/lib/types/database.types.ts
git commit -m "chore: update DB types from production schema"
git push
```

---

## BAGIAN 3 — Google Cloud & Drive

### 3.1 Buat Google Cloud Project

1. Buka [console.cloud.google.com](https://console.cloud.google.com)
2. Klik dropdown project → **New Project**
3. Nama: `audy-lms`
4. Klik **Create**

### 3.2 Enable Drive API

1. **APIs & Services → Library**
2. Cari: `Google Drive API`
3. Klik **Enable**

### 3.3 Buat Service Account

1. **IAM & Admin → Service Accounts → + Create Service Account**
2. Name: `audy-lms-drive`
3. ID: `audy-lms-drive` (otomatis)
4. Klik **Create and Continue**
5. **Lewati** bagian Grant access (role di-set di Drive, bukan IAM)
6. Klik **Done**

### 3.4 Buat Service Account Key

1. Klik service account yang baru dibuat
2. Tab **Keys → Add Key → Create new key**
3. Format: **JSON**
4. Klik **Create** → file JSON ter-download

Buka file JSON tersebut, catat dua nilai:

```json
{
  "client_email": "audy-lms-drive@audy-lms.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
}
```

> ⚠️ **JANGAN commit file JSON ini ke git.** Hapus setelah dicatat nilainya.

### 3.5 Buat Google Workspace Shared Drive

> Memerlukan akun Google Workspace (bukan Gmail biasa).

1. Buka [drive.google.com](https://drive.google.com)
2. Sidebar kiri → **Shared Drives → New**
3. Nama: **Audy Learning Centre**
4. Klik **Create**

### 3.6 Tambahkan Service Account ke Shared Drive

1. Klik kanan **Audy Learning Centre** → **Manage members**
2. Klik **Add members**
3. Email: `audy-lms-drive@audy-lms.iam.gserviceaccount.com`
4. Role: **Content Manager**
5. Klik **Send**

### 3.7 Catat Root Folder ID

1. Buka Shared Drive **Audy Learning Centre** di Drive
2. Lihat URL browser:
   ```
   https://drive.google.com/drive/folders/FOLDER_ID_DI_SINI
   ```
3. Salin nilai `FOLDER_ID_DI_SINI` → ini adalah `GOOGLE_DRIVE_ROOT_FOLDER_ID`

---

## BAGIAN 4 — Vercel

### 4.1 Import project

1. Buka [vercel.com/new](https://vercel.com/new)
2. Pilih **Import Git Repository**
3. Pilih `audy-lms` dari daftar
4. Framework: **SvelteKit** (auto-detected)
5. **Jangan deploy dulu** — set env vars terlebih dahulu

### 4.2 Set Environment Variables

Di halaman konfigurasi project (atau **Settings → Environment Variables** setelah import):

Centang semua: **Production** ✅ **Preview** ✅ **Development** ✅

```
# Supabase (public — aman di browser)
PUBLIC_SUPABASE_URL                    = https://YOUR_REF.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE_KEY        = eyJhbG...

# Supabase (server only — RAHASIA)
SUPABASE_SERVICE_ROLE_KEY              = eyJhbG...

# App
PUBLIC_APP_URL                         = https://alc.audydental.com
PUBLIC_APP_NAME                        = Audy Learning Centre

# Google (server only — RAHASIA)
GOOGLE_SERVICE_ACCOUNT_EMAIL           = audy-lms-drive@audy-lms.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY     = -----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n

# Google Drive Folder IDs
GOOGLE_DRIVE_ROOT_FOLDER_ID            = (dari langkah 3.7)
GOOGLE_DRIVE_GROWTH_JOURNEY_FOLDER_ID  = (dikosongkan dulu — diisi setelah init)
GOOGLE_DRIVE_PRODUCT_KNOWLEDGE_FOLDER_ID =
GOOGLE_DRIVE_PLAY_LEARN_FOLDER_ID      =
GOOGLE_DRIVE_LETS_PRACTICE_FOLDER_ID   =
GOOGLE_DRIVE_FRESH_UPDATE_FOLDER_ID    =
GOOGLE_DRIVE_QNA_FOLDER_ID             =
GOOGLE_DRIVE_SYSTEM_FOLDER_ID          =
```

> **Format Private Key di Vercel:** Salin nilai `private_key` dari file JSON persis apa adanya (sudah ada `\n`-nya). Vercel menyimpannya sebagai string mentah.

### 4.3 Deploy pertama

Klik **Deploy**. Proses build ~3–5 menit.

Jika gagal karena symlink (EPERM) → tidak apa-apa, ini hanya pada Windows. Di Vercel (Linux) build akan berhasil.

### 4.4 Set custom domain

1. **Settings → Domains → Add**
2. Masukkan: `alc.audydental.com`
3. Ikuti petunjuk DNS dari Vercel (biasanya tambah CNAME record)
4. Tunggu propagasi DNS (~5–30 menit)

---

## BAGIAN 5 — Inisialisasi Drive Folders

Setelah deploy pertama berhasil dan domain aktif:

### 5.1 Login sebagai admin

Buka `https://alc.audydental.com/login` → login dengan akun admin yang sudah dibuat.

### 5.2 Jalankan inisialisasi folder

```bash
# Jalankan dari terminal (ganti SESSION_COOKIE dengan cookie dari browser)
curl -X POST https://alc.audydental.com/api/drive/init \
  -H "Cookie: sb-YOUR_PROJECT_REF-auth-token=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json"
```

**Atau lebih mudah:** Buka browser developer tools setelah login, lalu di Console:

```javascript
const res = await fetch('/api/drive/init', { method: 'POST' });
const data = await res.json();
console.log(JSON.stringify(data.data.folders, null, 2));
```

### 5.3 Catat Folder IDs

Response akan berisi:

```json
{
  "data": {
    "rootFolderId": "xxx",
    "folders": {
      "growth-journey": "FOLDER_ID_GJ",
      "product-knowledge": "FOLDER_ID_PK",
      "play-learn": "FOLDER_ID_PL",
      "lets-practice": "FOLDER_ID_LP",
      "fresh-update": "FOLDER_ID_FU",
      "qna": "FOLDER_ID_QNA",
      "system": "FOLDER_ID_SYS"
    }
  }
}
```

### 5.4 Update Vercel Environment Variables

Di **Vercel → Settings → Environment Variables**, update semua folder ID:

```
GOOGLE_DRIVE_GROWTH_JOURNEY_FOLDER_ID    = FOLDER_ID_GJ
GOOGLE_DRIVE_PRODUCT_KNOWLEDGE_FOLDER_ID = FOLDER_ID_PK
GOOGLE_DRIVE_PLAY_LEARN_FOLDER_ID        = FOLDER_ID_PL
GOOGLE_DRIVE_LETS_PRACTICE_FOLDER_ID     = FOLDER_ID_LP
GOOGLE_DRIVE_FRESH_UPDATE_FOLDER_ID      = FOLDER_ID_FU
GOOGLE_DRIVE_QNA_FOLDER_ID               = FOLDER_ID_QNA
GOOGLE_DRIVE_SYSTEM_FOLDER_ID            = FOLDER_ID_SYS
```

### 5.5 Redeploy

**Deployments → klik tiga titik deployment terakhir → Redeploy**

---

## BAGIAN 6 — Verifikasi Post-Deploy

Lakukan pengecekan berikut setelah deploy selesai:

### Autentikasi
- [ ] `/login` terbuka dan form tampil
- [ ] Login admin berhasil → redirect ke `/dashboard`
- [ ] Logout berhasil → redirect ke `/login`
- [ ] URL `/dashboard` tanpa login → redirect ke `/login`
- [ ] URL `/admin/users` dengan akun STAFF → 403

### Growth Journey
- [ ] `/growth-journey` menampilkan 4 stage
- [ ] Klik stage → detail dengan tabs terbuka
- [ ] Klik materi → konten terbuka, bisa ditandai selesai
- [ ] Progress tersimpan di database

### File Upload
- [ ] Admin tambah materi dengan lampiran gambar
- [ ] File muncul di Google Drive folder yang benar
- [ ] File bisa ditampilkan di halaman materi karyawan
- [ ] `/api/files/[id]/stream` memerlukan session (cek tanpa login → redirect)

### Rewards
- [ ] Selesaikan materi → poin bertambah di `/points`
- [ ] Cek `/badges` → badge "Langkah Pertama" muncul setelah materi pertama
- [ ] Selesaikan semua stage → sertifikat ter-generate

### Backup
- [ ] `/admin/backup` → klik "Mulai Backup" → status berubah ke Completed
- [ ] File JSON muncul di `99 - System/Backups` di Google Drive

### Reports
- [ ] `/admin/reports/employee-summary` → data muncul
- [ ] Klik "⬇ CSV" → file terunduh

---

## BAGIAN 7 — Pembuatan User Karyawan

Setiap karyawan dibuat oleh Admin:

### Via Supabase Dashboard

1. **Authentication → Users → Add user**
2. Isi email + password sementara
3. Auto Confirm: ✅

### Via SQL (update profile)

```sql
UPDATE profiles
SET
    full_name     = 'Nama Karyawan',
    employee_code = 'ALC-002',
    role          = 'STAFF',
    department_id = (SELECT id FROM departments WHERE name = 'Klinik'),
    position_id   = (SELECT id FROM positions WHERE name = 'PERAWAT_GIGI'),
    is_active     = true
WHERE email = 'karyawan@audydental.com';
```

### Minta karyawan ganti password

Karyawan login pertama kali → Supabase akan kirim email konfirmasi jika dikonfigurasi, atau admin informasikan password sementara secara langsung.

---

## BAGIAN 8 — Maintenance Rutin

### Backup berkala

Buat jadwal backup mingguan (manual atau via cron di Vercel):

```bash
# Bisa dijadwalkan via cron job eksternal yang hit endpoint
POST /admin/backup (dengan session admin)
```

### Update aplikasi

```bash
# Buat perubahan di branch feature
git checkout -b feature/nama-fitur

# Commit dan push
git add .
git commit -m "feat: deskripsi fitur"
git push origin feature/nama-fitur

# Buat PR ke develop → review → merge
# Setelah merge ke main → Vercel auto deploy
```

### Tambah migrasi database baru

```bash
# Buat file migrasi baru
supabase migration new nama_migrasi

# Edit file di supabase/migrations/
# Push ke production
supabase db push
```

---

## Troubleshooting Umum

| Masalah | Kemungkinan Penyebab | Solusi |
|---|---|---|
| Build gagal di Vercel | Missing env var | Cek semua env var sudah diset |
| Login gagal | Auth URL tidak match | Update Site URL di Supabase Dashboard |
| Upload file gagal | Folder ID kosong | Jalankan `/api/drive/init` lagi |
| `PERMISSION_DENIED` Drive | SA belum di Shared Drive | Tambah SA sebagai Content Manager |
| RLS memblok query | Role belum diset | Update `profiles.role` di SQL Editor |
| Certificate gagal generate | Chromium timeout | Naikkan `maxDuration` di `vercel.json` |
| Poin tidak bertambah | Rewards integration error | Cek `/admin/audit-logs` untuk error |

---

## Kontak & Referensi

| Layanan | Dashboard | Dokumentasi |
|---|---|---|
| Supabase | [supabase.com/dashboard](https://supabase.com/dashboard) | [supabase.com/docs](https://supabase.com/docs) |
| Vercel | [vercel.com/dashboard](https://vercel.com/dashboard) | [vercel.com/docs](https://vercel.com/docs) |
| Google Cloud | [console.cloud.google.com](https://console.cloud.google.com) | [cloud.google.com/docs](https://cloud.google.com/docs) |
| Google Drive API | — | [developers.google.com/drive](https://developers.google.com/drive) |

---

*Dokumen ini mencakup keseluruhan proses deployment pertama kali. Untuk detail teknis setiap komponen, lihat dokumen tambahan di folder `docs/`.*
