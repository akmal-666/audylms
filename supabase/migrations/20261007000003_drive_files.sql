-- ============================================================
-- ALC Google Drive File Metadata
-- 20261007000003_drive_files.sql
--
-- Google Drive is the PRIMARY binary storage.
-- These tables hold metadata ONLY — no binary data in PostgreSQL.
--
-- Architecture:
--   learning content
--       ↓
--   material_attachments (join table)
--       ↓
--   drive_files (metadata row)
--       ↓
--   Google Drive file (actual binary)
-- ============================================================

-- ============================================================
-- ENUM: drive_entity_type
-- What kind of learning entity owns this file.
-- ============================================================

CREATE TYPE drive_entity_type AS ENUM (
    'MATERIAL',
    'CASE',
    'ASSESSMENT',
    'PRODUCT_KNOWLEDGE',
    'FRESH_UPDATE',
    'PRACTICE',
    'GAME',
    'QNA',
    'PROFILE',
    'CERTIFICATE',
    'SYSTEM'
);

-- ============================================================
-- ENUM: attachment_type
-- The nature of the binary content.
-- ============================================================

CREATE TYPE attachment_type AS ENUM (
    'IMAGE',
    'VIDEO',
    'DOCUMENT',
    'PDF',
    'SPREADSHEET',
    'PRESENTATION',
    'OTHER'
);

-- ============================================================
-- TABLE: drive_files
-- One row per file stored in Google Drive.
-- ============================================================

CREATE TABLE drive_files (
    id                  uuid            PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Google Drive identifiers
    drive_file_id       text            NOT NULL UNIQUE,   -- Google Drive file id
    drive_folder_id     text,                              -- parent folder id in Drive

    -- File metadata
    name                text            NOT NULL,
    mime_type           text            NOT NULL,
    size_bytes          bigint,
    web_view_url        text,           -- Drive webViewLink  (viewer, not download)
    web_content_url     text,           -- Drive webContentLink (download)
    thumbnail_url       text,           -- Drive thumbnailLink

    -- Application context
    storage_area        text            NOT NULL,  -- e.g. 'growth-journey', 'product-knowledge'
    entity_type         drive_entity_type NOT NULL,
    entity_id           uuid,           -- FK into the owning entity table (nullable; set later)

    -- Ownership / tracking
    uploaded_by         uuid            REFERENCES profiles(id) ON DELETE SET NULL,

    -- Soft delete
    deleted_at          timestamptz,

    created_at          timestamptz     NOT NULL DEFAULT now(),
    updated_at          timestamptz     NOT NULL DEFAULT now()
);

COMMENT ON TABLE drive_files IS
    'Metadata for every file stored in Google Drive. Never stores binary data.';

COMMENT ON COLUMN drive_files.drive_file_id IS
    'The Google Drive fileId — use this to call Drive API operations.';

COMMENT ON COLUMN drive_files.entity_id IS
    'UUID of the owning entity (e.g. a material row). Null until the parent entity is saved.';

-- ============================================================
-- TABLE: material_attachments
-- Join table: learning material ↔ drive_files
-- ============================================================

CREATE TABLE material_attachments (
    id              uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id     uuid            NOT NULL,   -- FK to future materials table
    drive_file_id   uuid            NOT NULL    REFERENCES drive_files(id) ON DELETE CASCADE,
    attachment_type attachment_type NOT NULL,
    display_name    text,
    sequence        integer         NOT NULL DEFAULT 0,  -- display order
    created_at      timestamptz     NOT NULL DEFAULT now(),

    CONSTRAINT material_attachments_order_unique UNIQUE (material_id, sequence)
);

COMMENT ON TABLE material_attachments IS
    'Join table linking learning materials to their Google Drive file attachments.';

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_drive_files_entity_type   ON drive_files(entity_type);
CREATE INDEX idx_drive_files_entity_id     ON drive_files(entity_id);
CREATE INDEX idx_drive_files_storage_area  ON drive_files(storage_area);
CREATE INDEX idx_drive_files_uploaded_by   ON drive_files(uploaded_by);
CREATE INDEX idx_drive_files_deleted_at    ON drive_files(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_material_attachments_material  ON material_attachments(material_id);
CREATE INDEX idx_material_attachments_file      ON material_attachments(drive_file_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER set_drive_files_updated_at
    BEFORE UPDATE ON drive_files
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
