-- ============================================================
-- Growth Journey Schema
-- 20261007000005_growth_journey.sql
--
-- Tables:
--   gj_stages            — dynamically ordered stages
--   gj_materials         — rich content within each stage
--   gj_material_content  — ordered content blocks per material
--   gj_cases             — case studies per stage
--   gj_quizzes           — quizzes per stage
--   gj_quiz_questions    — questions per quiz
--   gj_quiz_options      — answer choices per question
--   gj_attachments       — join: gj_materials ↔ drive_files
--   gj_user_progress     — per-user stage progress
--   gj_material_progress — per-user material completion
--   gj_quiz_attempts     — quiz attempt records
--   gj_quiz_answers      — individual answer records
-- ============================================================

-- ── Enums ──────────────────────────────────────────────────

CREATE TYPE gj_content_type AS ENUM (
    'RICH_TEXT',      -- HTML rich text body
    'IMAGE',          -- single image from Drive
    'VIDEO',          -- video from Drive or external
    'DOCUMENT',       -- PDF / Word / Sheets from Drive
    'GOOGLE_DOCS',    -- Google Docs viewer link
    'EXTERNAL_LINK'   -- arbitrary URL
);

CREATE TYPE gj_progress_status AS ENUM (
    'NOT_STARTED',
    'IN_PROGRESS',
    'COMPLETED'
);

-- ── Stages ─────────────────────────────────────────────────

CREATE TABLE gj_stages (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    sort_order      integer     NOT NULL DEFAULT 0,
    title           text        NOT NULL,
    description     text,
    icon            text,                        -- emoji or icon name
    estimated_min   integer,                     -- estimated duration in minutes
    points_reward   integer     NOT NULL DEFAULT 0,
    position_filter text[],                      -- NULL = all positions
    is_published    boolean     NOT NULL DEFAULT false,
    created_by      uuid        REFERENCES profiles(id) ON DELETE SET NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN gj_stages.sort_order IS
    'Display order. Stage numbers are derived from sort_order, never hardcoded.';
COMMENT ON COLUMN gj_stages.position_filter IS
    'NULL means visible to all positions. Non-null restricts to listed positions.';

-- ── Materials ──────────────────────────────────────────────

CREATE TABLE gj_materials (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id        uuid        NOT NULL REFERENCES gj_stages(id) ON DELETE CASCADE,
    sort_order      integer     NOT NULL DEFAULT 0,
    title           text        NOT NULL,
    summary         text,
    estimated_min   integer,
    is_required     boolean     NOT NULL DEFAULT true,
    is_published    boolean     NOT NULL DEFAULT false,
    created_by      uuid        REFERENCES profiles(id) ON DELETE SET NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ── Material Content Blocks ─────────────────────────────────

CREATE TABLE gj_material_content (
    id              uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id     uuid             NOT NULL REFERENCES gj_materials(id) ON DELETE CASCADE,
    sort_order      integer          NOT NULL DEFAULT 0,
    content_type    gj_content_type  NOT NULL,
    body            text,            -- rich text HTML / URL / Drive fileId
    drive_file_id   uuid             REFERENCES drive_files(id) ON DELETE SET NULL,
    caption         text,
    created_at      timestamptz      NOT NULL DEFAULT now(),
    updated_at      timestamptz      NOT NULL DEFAULT now()
);

-- ── Cases ──────────────────────────────────────────────────

CREATE TABLE gj_cases (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id        uuid        NOT NULL REFERENCES gj_stages(id) ON DELETE CASCADE,
    sort_order      integer     NOT NULL DEFAULT 0,
    title           text        NOT NULL,
    description     text,
    body            text,        -- rich text HTML
    is_published    boolean     NOT NULL DEFAULT false,
    created_by      uuid        REFERENCES profiles(id) ON DELETE SET NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ── Quizzes ────────────────────────────────────────────────

CREATE TABLE gj_quizzes (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id        uuid        NOT NULL REFERENCES gj_stages(id) ON DELETE CASCADE,
    sort_order      integer     NOT NULL DEFAULT 0,
    title           text        NOT NULL,
    description     text,
    passing_score   integer     NOT NULL DEFAULT 70,   -- percentage 0-100
    max_attempts    integer,                            -- NULL = unlimited
    time_limit_min  integer,                            -- NULL = no limit
    is_published    boolean     NOT NULL DEFAULT false,
    created_by      uuid        REFERENCES profiles(id) ON DELETE SET NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE gj_quiz_questions (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id         uuid        NOT NULL REFERENCES gj_quizzes(id) ON DELETE CASCADE,
    sort_order      integer     NOT NULL DEFAULT 0,
    question_text   text        NOT NULL,
    explanation     text,        -- shown after answer
    points          integer     NOT NULL DEFAULT 1,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE gj_quiz_options (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id     uuid        NOT NULL REFERENCES gj_quiz_questions(id) ON DELETE CASCADE,
    sort_order      integer     NOT NULL DEFAULT 0,
    option_text     text        NOT NULL,
    is_correct      boolean     NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── Attachments (join: gj_materials ↔ drive_files) ─────────

CREATE TABLE gj_attachments (
    id              uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id     uuid            NOT NULL REFERENCES gj_materials(id) ON DELETE CASCADE,
    drive_file_id   uuid            NOT NULL REFERENCES drive_files(id) ON DELETE CASCADE,
    attachment_type attachment_type NOT NULL,
    display_name    text,
    sequence        integer         NOT NULL DEFAULT 0,
    created_at      timestamptz     NOT NULL DEFAULT now(),
    UNIQUE (material_id, drive_file_id)
);

-- ── User Progress ───────────────────────────────────────────

CREATE TABLE gj_user_progress (
    id              uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid                NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    stage_id        uuid                NOT NULL REFERENCES gj_stages(id) ON DELETE CASCADE,
    status          gj_progress_status  NOT NULL DEFAULT 'NOT_STARTED',
    completed_at    timestamptz,
    created_at      timestamptz         NOT NULL DEFAULT now(),
    updated_at      timestamptz         NOT NULL DEFAULT now(),
    UNIQUE (user_id, stage_id)
);

CREATE TABLE gj_material_progress (
    id              uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid                NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    material_id     uuid                NOT NULL REFERENCES gj_materials(id) ON DELETE CASCADE,
    status          gj_progress_status  NOT NULL DEFAULT 'NOT_STARTED',
    completed_at    timestamptz,
    created_at      timestamptz         NOT NULL DEFAULT now(),
    updated_at      timestamptz         NOT NULL DEFAULT now(),
    UNIQUE (user_id, material_id)
);

CREATE TABLE gj_quiz_attempts (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    quiz_id         uuid        NOT NULL REFERENCES gj_quizzes(id) ON DELETE CASCADE,
    score           integer,    -- percentage 0-100
    passed          boolean,
    started_at      timestamptz NOT NULL DEFAULT now(),
    completed_at    timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE gj_quiz_answers (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id      uuid        NOT NULL REFERENCES gj_quiz_attempts(id) ON DELETE CASCADE,
    question_id     uuid        NOT NULL REFERENCES gj_quiz_questions(id) ON DELETE CASCADE,
    option_id       uuid        REFERENCES gj_quiz_options(id) ON DELETE SET NULL,
    is_correct      boolean,
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ─────────────────────────────────────────────────

CREATE INDEX idx_gj_stages_sort          ON gj_stages(sort_order);
CREATE INDEX idx_gj_stages_published     ON gj_stages(is_published);
CREATE INDEX idx_gj_materials_stage      ON gj_materials(stage_id, sort_order);
CREATE INDEX idx_gj_materials_published  ON gj_materials(is_published);
CREATE INDEX idx_gj_content_material     ON gj_material_content(material_id, sort_order);
CREATE INDEX idx_gj_cases_stage          ON gj_cases(stage_id, sort_order);
CREATE INDEX idx_gj_quizzes_stage        ON gj_quizzes(stage_id, sort_order);
CREATE INDEX idx_gj_questions_quiz       ON gj_quiz_questions(quiz_id, sort_order);
CREATE INDEX idx_gj_options_question     ON gj_quiz_options(question_id, sort_order);
CREATE INDEX idx_gj_attachments_material ON gj_attachments(material_id, sequence);
CREATE INDEX idx_gj_user_progress_user   ON gj_user_progress(user_id);
CREATE INDEX idx_gj_user_progress_stage  ON gj_user_progress(stage_id);
CREATE INDEX idx_gj_mat_progress_user    ON gj_material_progress(user_id);
CREATE INDEX idx_gj_attempts_user_quiz   ON gj_quiz_attempts(user_id, quiz_id);

-- ── Triggers ─────────────────────────────────────────────────

CREATE TRIGGER set_gj_stages_updated_at
    BEFORE UPDATE ON gj_stages FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_gj_materials_updated_at
    BEFORE UPDATE ON gj_materials FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_gj_content_updated_at
    BEFORE UPDATE ON gj_material_content FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_gj_cases_updated_at
    BEFORE UPDATE ON gj_cases FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_gj_quizzes_updated_at
    BEFORE UPDATE ON gj_quizzes FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_gj_user_progress_updated_at
    BEFORE UPDATE ON gj_user_progress FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_gj_mat_progress_updated_at
    BEFORE UPDATE ON gj_material_progress FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
