-- ============================================================
-- Rewards — Points, Badges, Levels, Certificates
-- 20261007000009_rewards.sql
--
-- Tables:
--   point_rules       — configurable rules for awarding points
--   point_transactions — append-only ledger of all point events
--   levels            — level definitions (thresholds, labels)
--   badges            — badge catalogue
--   user_badges       — awarded badges per user
--   certificates      — earned certificates
--   certificate_templates — Drive-hosted template assets
-- ============================================================

-- ── Enums ──────────────────────────────────────────────────

CREATE TYPE point_event_type AS ENUM (
    'MATERIAL_COMPLETE',
    'CASE_COMPLETE',
    'QUIZ_PASS',
    'QUIZ_PERFECT',      -- 100% score bonus
    'QUESTION_CORRECT',  -- per-question bonus (optional, rule-based)
    'VERIFIED_ANSWER',   -- QnA verified answer
    'GAME_COMPLETE',
    'STREAK_BONUS',
    'MANUAL_AWARD',
    'MANUAL_DEDUCT'
);

CREATE TYPE badge_criteria_type AS ENUM (
    'POINTS_THRESHOLD',
    'STAGE_COMPLETE',
    'ALL_STAGES_COMPLETE',
    'QUIZ_STREAK',       -- pass N quizzes in a row
    'PERFECT_QUIZ',
    'MANUAL'
);

-- ── Point Rules ─────────────────────────────────────────────
-- Configurable by admin. One row per event_type.
-- base_points can be overridden per-entity via the entity_points JSONB.

CREATE TABLE point_rules (
    id              uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type      point_event_type NOT NULL UNIQUE,
    base_points     integer         NOT NULL DEFAULT 0,
    description     text,
    is_active       boolean         NOT NULL DEFAULT true,
    created_at      timestamptz     NOT NULL DEFAULT now(),
    updated_at      timestamptz     NOT NULL DEFAULT now()
);

COMMENT ON TABLE point_rules IS
    'Configurable point values per event type. Changed by admin, applied server-side.';

-- ── Point Transactions ──────────────────────────────────────
-- Append-only ledger. Never updated or deleted.
-- Idempotency via idempotency_key: same key = same event, insert ignored.

CREATE TABLE point_transactions (
    id              uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid            NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    event_type      point_event_type NOT NULL,
    points          integer         NOT NULL,    -- can be negative for deductions
    entity_type     text,           -- e.g. 'gj_materials', 'gj_quizzes'
    entity_id       uuid,           -- FK into the entity table (denormalised)
    idempotency_key text            NOT NULL,
    notes           text,
    created_at      timestamptz     NOT NULL DEFAULT now(),
    CONSTRAINT point_transactions_idempotency UNIQUE (user_id, idempotency_key)
);

COMMENT ON COLUMN point_transactions.idempotency_key IS
    'Prevents double-awarding. Format: {event_type}:{entity_id} or {event_type}:{user_id}:{ref}.';
COMMENT ON COLUMN point_transactions.points IS
    'Positive = award, negative = deduction. Never modified after insert.';

CREATE INDEX idx_point_txn_user     ON point_transactions(user_id);
CREATE INDEX idx_point_txn_entity   ON point_transactions(entity_type, entity_id);
CREATE INDEX idx_point_txn_created  ON point_transactions(created_at DESC);

-- ── Levels ─────────────────────────────────────────────────
-- Level 1 starts at 0 points.
-- Level N starts at points_required points.

CREATE TABLE levels (
    id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
    level_number    integer NOT NULL UNIQUE,
    label           text    NOT NULL,   -- e.g. "Pemula", "Mahir"
    points_required integer NOT NULL,
    icon            text,               -- emoji or icon name
    description     text,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_levels_points ON levels(points_required);

-- ── Badges ─────────────────────────────────────────────────

CREATE TABLE badges (
    id              uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            text                NOT NULL UNIQUE,
    title           text                NOT NULL,
    description     text,
    icon            text,               -- emoji
    image_drive_file_id uuid            REFERENCES drive_files(id) ON DELETE SET NULL,
    criteria_type   badge_criteria_type NOT NULL,
    criteria_value  jsonb,              -- e.g. {"points": 500} or {"stage_id": "uuid"}
    is_active       boolean             NOT NULL DEFAULT true,
    created_at      timestamptz         NOT NULL DEFAULT now(),
    updated_at      timestamptz         NOT NULL DEFAULT now()
);

-- ── User Badges ─────────────────────────────────────────────

CREATE TABLE user_badges (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    badge_id        uuid        NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    awarded_at      timestamptz NOT NULL DEFAULT now(),
    awarded_by      uuid        REFERENCES profiles(id) ON DELETE SET NULL,
    notes           text,
    UNIQUE (user_id, badge_id)
);

CREATE INDEX idx_user_badges_user  ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge ON user_badges(badge_id);

-- ── Certificate Templates ───────────────────────────────────
-- Template assets stored in Google Drive → 99 - System.

CREATE TABLE certificate_templates (
    id                  uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
    name                text    NOT NULL UNIQUE,
    description         text,
    -- Drive file IDs for template assets
    background_drive_file_id    uuid REFERENCES drive_files(id) ON DELETE SET NULL,
    logo_drive_file_id          uuid REFERENCES drive_files(id) ON DELETE SET NULL,
    signature_drive_file_id     uuid REFERENCES drive_files(id) ON DELETE SET NULL,
    -- HTML template body (used for PDF generation)
    html_template       text    NOT NULL DEFAULT '',
    is_active           boolean NOT NULL DEFAULT true,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ── Certificates ────────────────────────────────────────────

CREATE TABLE certificates (
    id                  uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             uuid    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    -- What was certified
    entity_type         text    NOT NULL,  -- 'GJ_STAGE', 'GJ_ALL_STAGES', etc.
    entity_id           uuid,              -- e.g. stage_id (nullable for "all stages")
    entity_label        text    NOT NULL,  -- human-readable label for the cert
    -- Template
    template_id         uuid    REFERENCES certificate_templates(id) ON DELETE SET NULL,
    -- Generated PDF
    drive_file_id       uuid    REFERENCES drive_files(id) ON DELETE SET NULL,
    -- Verification
    verification_code   text    NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
    issued_at           timestamptz NOT NULL DEFAULT now(),
    -- Prevent duplicate certs for same achievement
    UNIQUE (user_id, entity_type, entity_id)
);

CREATE INDEX idx_certificates_user   ON certificates(user_id);
CREATE INDEX idx_certificates_verify ON certificates(verification_code);

-- ── Updated_at triggers ─────────────────────────────────────

CREATE TRIGGER set_point_rules_updated_at
    BEFORE UPDATE ON point_rules FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_badges_updated_at
    BEFORE UPDATE ON badges FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_cert_templates_updated_at
    BEFORE UPDATE ON certificate_templates FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
