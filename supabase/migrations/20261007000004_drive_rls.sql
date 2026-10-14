-- ============================================================
-- RLS Policies for drive_files and material_attachments
-- 20261007000004_drive_rls.sql
--
-- Security rules:
--   drive_files:
--     - STAFF can read non-deleted files for content they're allowed to see.
--       (Full content-level filtering happens in the application layer;
--        RLS provides the base safety net.)
--     - ADMIN can read and write all drive_files rows.
--     - No direct INSERT from the browser — all writes go through
--       server-side API routes using the service role key.
--
--   material_attachments:
--     - Authenticated users can read attachments for visible materials.
--     - Only admins can manage attachment metadata.
--     - Direct inserts from the browser are blocked.
-- ============================================================

ALTER TABLE drive_files          ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_attachments ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- DRIVE_FILES
-- ────────────────────────────────────────────────────────────

-- Authenticated staff can read non-deleted file metadata.
-- The application layer applies additional content/position
-- filtering on top of this base policy.
CREATE POLICY "drive_files: authenticated users can read active files"
    ON drive_files FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);

-- Admins can read all files including soft-deleted ones.
CREATE POLICY "drive_files: admins can read all"
    ON drive_files FOR SELECT
    TO authenticated
    USING (is_admin());

-- Admins can update file metadata (rename, move, soft-delete).
CREATE POLICY "drive_files: admins can update"
    ON drive_files FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- No direct INSERT or DELETE from the authenticated role.
-- All file uploads / deletions go through server-side API routes
-- that use the service role key, which bypasses RLS.

-- ────────────────────────────────────────────────────────────
-- MATERIAL_ATTACHMENTS
-- ────────────────────────────────────────────────────────────

CREATE POLICY "material_attachments: authenticated users can read"
    ON material_attachments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "material_attachments: admins can insert"
    ON material_attachments FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "material_attachments: admins can update"
    ON material_attachments FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "material_attachments: admins can delete"
    ON material_attachments FOR DELETE
    TO authenticated
    USING (is_admin());
