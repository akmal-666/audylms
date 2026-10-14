-- ============================================================
-- Assessment Engine — Phase 4
-- 20261007000007_assessment_engine.sql
--
-- Extends the Growth Journey schema with:
--   1. gj_case_attachments       — Drive files for case studies
--   2. gj_question_attachments   — Drive files for quiz questions
--   3. Versioning columns on gj_cases and gj_quizzes
--   4. Quiz refresh / expiry window
--   5. Duplicate submission guard (unique active attempt)
--   6. gj_case_progress          — per-user case completion
-- ============================================================

-- ── 1. Case Attachments (Google Drive) ────────────────────────

CREATE TABLE gj_case_attachments (
    id              uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id         uuid            NOT NULL REFERENCES gj_cases(id) ON DELETE CASCADE,
    drive_file_id   uuid            NOT NULL REFERENCES drive_files(id) ON DELETE CASCADE,
    attachment_type attachment_type NOT NULL,
    display_name    text,
    sequence        integer         NOT NULL DEFAULT 0,
    created_at      timestamptz     NOT NULL DEFAULT now(),
    UNIQUE (case_id, drive_file_id)
);

CREATE INDEX idx_gj_case_attachments_case ON gj_case_attachments(case_id, sequence);

-- ── 2. Question Attachments (Google Drive) ────────────────────
-- Each quiz question may carry a supporting image/video/document.
-- IMPORTANT: this table only stores the reference.
-- The actual file is in Google Drive.

CREATE TABLE gj_question_attachments (
    id              uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id     uuid            NOT NULL REFERENCES gj_quiz_questions(id) ON DELETE CASCADE,
    drive_file_id   uuid            NOT NULL REFERENCES drive_files(id) ON DELETE CASCADE,
    attachment_type attachment_type NOT NULL,
    display_name    text,
    created_at      timestamptz     NOT NULL DEFAULT now(),
    UNIQUE (question_id, drive_file_id)
);

CREATE INDEX idx_gj_q_attachments_question ON gj_question_attachments(question_id);

-- ── 3. Versioning on gj_cases ─────────────────────────────────
-- version_number starts at 1 and increments on each publish.
-- parent_case_id links a revised case back to the original.
-- Employees who completed an earlier version may need to retake.

ALTER TABLE gj_cases
    ADD COLUMN version_number  integer     NOT NULL DEFAULT 1,
    ADD COLUMN parent_case_id  uuid        REFERENCES gj_cases(id) ON DELETE SET NULL,
    ADD COLUMN requires_retake boolean     NOT NULL DEFAULT false;

-- ── 4. Versioning on gj_quizzes ──────────────────────────────
-- Same versioning pattern as cases.

ALTER TABLE gj_quizzes
    ADD COLUMN version_number   integer     NOT NULL DEFAULT 1,
    ADD COLUMN parent_quiz_id   uuid        REFERENCES gj_quizzes(id) ON DELETE SET NULL,
    ADD COLUMN requires_retake  boolean     NOT NULL DEFAULT false;

-- Quiz refresh window — days until a passed quiz expires.
-- NULL = disabled (never expires).
-- Common values: 30, 60, 90, 180.

ALTER TABLE gj_quizzes
    ADD COLUMN refresh_days  integer;    -- NULL = disabled

COMMENT ON COLUMN gj_quizzes.refresh_days IS
    'Days after which a passed attempt expires and the employee must retake. NULL = disabled.';

-- ── 5. Duplicate submission guard ────────────────────────────
-- An "in-progress" attempt that is not yet completed.
-- Only one in-progress attempt is allowed per user per quiz.

ALTER TABLE gj_quiz_attempts
    ADD COLUMN status  text NOT NULL DEFAULT 'COMPLETED'
    CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'ABANDONED'));

-- Prevent a second in-progress attempt while one is open.
CREATE UNIQUE INDEX idx_gj_attempts_one_active
    ON gj_quiz_attempts (user_id, quiz_id)
    WHERE status = 'IN_PROGRESS';

-- ── 6. Case Progress ─────────────────────────────────────────

CREATE TABLE gj_case_progress (
    id              uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid                NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    case_id         uuid                NOT NULL REFERENCES gj_cases(id) ON DELETE CASCADE,
    status          gj_progress_status  NOT NULL DEFAULT 'COMPLETED',
    version_number  integer             NOT NULL DEFAULT 1,
    completed_at    timestamptz         NOT NULL DEFAULT now(),
    UNIQUE (user_id, case_id)
);

CREATE INDEX idx_gj_case_progress_user  ON gj_case_progress(user_id);
CREATE INDEX idx_gj_case_progress_case  ON gj_case_progress(case_id);

-- ── 7. Scoring: weighted points per question ──────────────────
-- gj_quiz_questions.points already exists.
-- gj_quiz_attempts gets a points_earned column for the absolute total.

ALTER TABLE gj_quiz_attempts
    ADD COLUMN points_earned integer;

COMMENT ON COLUMN gj_quiz_attempts.points_earned IS
    'Sum of points from correct answers. Populated on completion.';

-- ── 8. Attempt lock — submitted_at ────────────────────────────
-- Prevents client from re-submitting after completion.
-- Once submitted_at IS NOT NULL the attempt is immutable.

ALTER TABLE gj_quiz_attempts
    ADD COLUMN submitted_at  timestamptz;

-- ── 9. Quiz attempt expiry helper view ───────────────────────
-- Returns whether each user's latest passing attempt is expired.

CREATE OR REPLACE VIEW gj_quiz_expiry AS
SELECT
    a.user_id,
    a.quiz_id,
    q.refresh_days,
    MAX(a.completed_at) AS last_passed_at,
    CASE
        WHEN q.refresh_days IS NULL THEN false
        WHEN MAX(a.completed_at) IS NULL THEN false
        ELSE (now() > MAX(a.completed_at) + (q.refresh_days || ' days')::interval)
    END AS is_expired
FROM gj_quiz_attempts a
JOIN gj_quizzes q ON q.id = a.quiz_id
WHERE a.passed = true
  AND a.status = 'COMPLETED'
GROUP BY a.user_id, a.quiz_id, q.refresh_days;

COMMENT ON VIEW gj_quiz_expiry IS
    'Indicates whether a user''s most recent passing quiz attempt has expired.';
