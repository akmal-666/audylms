-- ============================================================
-- Phase 8 — Backup Jobs & Extended Audit
-- 20261007000013_backup_reports.sql
-- ============================================================

CREATE TYPE backup_status AS ENUM (
    'PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RESTORED'
);

-- ── backup_jobs ───────────────────────────────────────────────
-- Records of every backup/restore operation.
-- The JSON payload stores metadata references only — no binary data.

CREATE TABLE backup_jobs (
    id              uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
    status          backup_status   NOT NULL DEFAULT 'PENDING',
    initiated_by    uuid            REFERENCES profiles(id) ON DELETE SET NULL,
    backup_type     text            NOT NULL DEFAULT 'FULL',  -- FULL | METADATA_ONLY
    -- Storage
    drive_file_id   uuid            REFERENCES drive_files(id) ON DELETE SET NULL,
    local_size_bytes bigint,
    -- Timing
    started_at      timestamptz,
    completed_at    timestamptz,
    -- Results
    record_counts   jsonb,          -- { "profiles": 42, "gj_stages": 4, ... }
    drive_file_ids_count integer,   -- total number of Drive file IDs in backup
    missing_files   jsonb,          -- array of drive_file_ids that no longer exist in Drive
    error_message   text,
    created_at      timestamptz     NOT NULL DEFAULT now()
);

CREATE INDEX idx_backup_jobs_status  ON backup_jobs(status, created_at DESC);
CREATE INDEX idx_backup_jobs_user    ON backup_jobs(initiated_by);

-- RLS
ALTER TABLE backup_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "backup_jobs: admins only"
    ON backup_jobs FOR ALL TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());

-- ── Extended audit actions enum documentation (comment only) ──
-- Actions tracked in audit_logs:
--   FILE_UPLOADED, FILE_REPLACED, FILE_DELETED, FILE_UNLINKED,
--   FILE_MOVED, FILE_DOWNLOADED,
--   CONTENT_PUBLISHED, CONTENT_UNPUBLISHED,
--   BACKUP_STARTED, BACKUP_COMPLETED, BACKUP_FAILED,
--   RESTORE_STARTED, RESTORE_COMPLETED, RESTORE_VALIDATED,
--   USER_CREATED, USER_UPDATED, USER_DEACTIVATED,
--   SETTING_CHANGED, REPORT_EXPORTED
COMMENT ON TABLE audit_logs IS
    'Append-only audit trail. Action values documented in migration 20261007000013.';
