# Google Drive Integration — Audy Learning Centre

**Version:** 2.0 (Updated Phase 8)
**Status:** IMPLEMENTED BUT NOT VERIFIED (requires real GCP + Drive credentials)

---

## Architecture

Google Drive is the **primary binary storage** for ALC. Supabase stores metadata only.

```
Learning content
    ↓
gj_attachments / fu_attachments / qna_attachments / etc.
    ↓
drive_files (Supabase — metadata row)
    ↓
Google Drive (actual binary file)
```

Employee file access flow:
```
Employee browser
    → GET /api/files/[supabase-uuid]/stream
    → SvelteKit server (validates session + ownership)
    → Google Drive API (service account auth)
    → Stream binary to browser
```

---

## Setup

### 1. Google Cloud Project

1. [console.cloud.google.com](https://console.cloud.google.com) → New Project (`audy-lms`)
2. APIs & Services → Library → **Google Drive API** → Enable

### 2. Service Account

1. IAM & Admin → Service Accounts → Create
2. Name: `audy-lms-drive`
3. Skip role assignment (permissions set on the Shared Drive itself)
4. Keys → Add Key → JSON → download

Set environment variables:
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=audy-lms-drive@YOUR_PROJECT.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMII...\n-----END PRIVATE KEY-----\n"
```

### 3. Google Workspace Shared Drive

1. drive.google.com → Shared Drives → New → `Audy Learning Centre`
2. Right-click → Manage Members → Add service account email → **Content Manager**
3. Note the root folder ID from the URL → set `GOOGLE_DRIVE_ROOT_FOLDER_ID`

### 4. Initialise Folder Structure

Run **once** after first deploy (requires admin session):

```bash
curl -X POST https://your-app.vercel.app/api/drive/init \
  -H "Cookie: your-admin-session-cookie"
```

Returns folder IDs — set each in Vercel env vars.

---

## Folder Structure

```
Audy Learning Centre (root)       ← GOOGLE_DRIVE_ROOT_FOLDER_ID
├── 01 - Growth Journey            ← GOOGLE_DRIVE_GROWTH_JOURNEY_FOLDER_ID
├── 02 - Product Knowledge         ← GOOGLE_DRIVE_PRODUCT_KNOWLEDGE_FOLDER_ID
├── 03 - Play & Learn              ← GOOGLE_DRIVE_PLAY_LEARN_FOLDER_ID
├── 04 - Lets Practice             ← GOOGLE_DRIVE_LETS_PRACTICE_FOLDER_ID
├── 05 - Fresh Update              ← GOOGLE_DRIVE_FRESH_UPDATE_FOLDER_ID
├── 06 - QnA                       ← GOOGLE_DRIVE_QNA_FOLDER_ID
└── 99 - System                    ← GOOGLE_DRIVE_SYSTEM_FOLDER_ID
    ├── Certificates/              ← auto-created by certificate service
    └── Backups/                   ← auto-created by backup service
```

---

## Service Layer (`src/lib/server/google-drive/`)

| File | Purpose |
|---|---|
| `client.ts` | GoogleAuth + Drive client singleton |
| `types.ts` | Shared types, MIME constants, folder map |
| `folders.ts` | findFolder, createFolder, findOrCreateFolder, initialiseFolderStructure |
| `files.ts` | getFileMetadata, listFiles, searchFiles, moveFile, deleteFile |
| `upload.ts` | uploadFile (multipart ≤5MB), initiateResumableUpload |
| `download.ts` | downloadFileToBuffer, streamFile (Range support), exportGoogleFile |
| `permissions.ts` | createPermission, deletePermission, listPermissions |
| `validation.ts` | validateFile (MIME, size, name, blocked extensions), mimeTypeToAttachmentType |
| `index.ts` | Barrel export |

---

## Supported File Types

| Category | MIME Types |
|---|---|
| Image | `image/jpeg`, `image/png`, `image/webp`, `image/gif` |
| Video | `video/mp4`, `video/quicktime`, `video/webm` |
| PDF | `application/pdf` |
| Document | `.doc`, `.docx`, Google Docs |
| Spreadsheet | `.xls`, `.xlsx`, Google Sheets |
| Presentation | `.ppt`, `.pptx`, Google Slides |

Max size: **3 MB** (configurable via `system_settings.file.max_size_bytes`)

---

## Security

1. Service account credentials are **server-only** (`$env/static/private`)
2. Employees request files by **Supabase UUID**, not Drive file ID
3. `/api/files/[id]/stream` validates session and ownership before streaming
4. Drive searches are scoped to the ALC root folder only
5. Drive file operations logged to `audit_logs`

---

## Admin Drive File Manager

`/admin/files` provides:
- List all ALC Drive files with reference counts
- **Replace**: upload new file → update metadata → preserve all content references
- **Delete**: if references exist → only unlink metadata; if no references → soft-delete
- **Search**: scoped to ALC root folder via `searchFiles()`

---

## Backup Integration

The backup service (`backup.ts`) captures all Drive file IDs and folder IDs in the JSON backup. Binary files are **never copied**. The backup contains only:

```json
{
  "drive_file_ids": ["gdrive-id-1", "gdrive-id-2", ...],
  "drive_folder_ids": ["folder-1", ...],
  "tables": { "drive_files": [...metadata rows...] }
}
```

`validateDriveReferences()` checks each Drive file ID still exists in Drive and marks missing ones with `deleted_at` in the `drive_files` table — it never silently ignores missing files.

---

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `PERMISSION_DENIED` | SA not in Shared Drive | Add SA as Content Manager |
| `File not found` | Wrong folder ID | Re-run `/api/drive/init` |
| `401 Unauthorized` | Wrong key | Check private key format with `\n` escapes |
| Upload fails | No folder ID set | Set all `GOOGLE_DRIVE_*_FOLDER_ID` env vars |
| Large file timeout | Default 10s Vercel timeout | Increase in `vercel.json` |
