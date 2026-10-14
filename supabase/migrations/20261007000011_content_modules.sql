-- ============================================================
-- Phase 6 — Content Modules + Notifications
-- 20261007000011_content_modules.sql
--
-- Modules:
--   Product Knowledge  (pk_*)
--   Play & Learn       (pl_*)
--   Lets Practice      (lp_*)
--   Tanya Jawab / QnA  (qna_*)
--   Ruang Aspirasi     (asp_*)
--   Fresh Update       (fu_*)
--   Notifications      (notifications)
--
-- All binary attachments → Google Drive.
-- All tables share the same rich-content pattern as Growth Journey.
-- ============================================================

-- ── Shared content type enum (reuse from GJ) ─────────────────
-- gj_content_type already exists; modules use the same values.
-- We alias it for clarity but reference the same underlying enum.

-- ══════════════════════════════════════════════════════════════
-- PRODUCT KNOWLEDGE
-- Category → Topic → Section (ordered content blocks)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE pk_categories (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    sort_order      integer     NOT NULL DEFAULT 0,
    title           text        NOT NULL,
    description     text,
    icon            text,
    position_filter text[],
    is_published    boolean     NOT NULL DEFAULT false,
    created_by      uuid        REFERENCES profiles(id) ON DELETE SET NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pk_topics (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id     uuid        NOT NULL REFERENCES pk_categories(id) ON DELETE CASCADE,
    sort_order      integer     NOT NULL DEFAULT 0,
    title           text        NOT NULL,
    summary         text,
    estimated_min   integer,
    is_published    boolean     NOT NULL DEFAULT false,
    created_by      uuid        REFERENCES profiles(id) ON DELETE SET NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pk_sections (
    id              uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id        uuid             NOT NULL REFERENCES pk_topics(id) ON DELETE CASCADE,
    sort_order      integer          NOT NULL DEFAULT 0,
    title           text,
    content_type    gj_content_type  NOT NULL,
    body            text,
    drive_file_id   uuid             REFERENCES drive_files(id) ON DELETE SET NULL,
    caption         text,
    created_at      timestamptz      NOT NULL DEFAULT now(),
    updated_at      timestamptz      NOT NULL DEFAULT now()
);

CREATE TABLE pk_progress (
    id              uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid                NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    topic_id        uuid                NOT NULL REFERENCES pk_topics(id) ON DELETE CASCADE,
    status          gj_progress_status  NOT NULL DEFAULT 'COMPLETED',
    completed_at    timestamptz         NOT NULL DEFAULT now(),
    UNIQUE (user_id, topic_id)
);

CREATE INDEX idx_pk_topics_cat      ON pk_topics(category_id, sort_order);
CREATE INDEX idx_pk_sections_topic  ON pk_sections(topic_id, sort_order);
CREATE INDEX idx_pk_progress_user   ON pk_progress(user_id);

-- ══════════════════════════════════════════════════════════════
-- PLAY & LEARN
-- Games with media questions; server-authoritative scoring.
-- ══════════════════════════════════════════════════════════════

CREATE TYPE pl_game_type AS ENUM (
    'FLASHCARD',
    'MATCH_PAIRS',
    'FILL_BLANK',
    'MULTIPLE_CHOICE',
    'ORDERING',
    'DRAG_DROP'
);

CREATE TABLE pl_games (
    id              uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
    title           text            NOT NULL,
    description     text,
    game_type       pl_game_type    NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    passing_score   integer         NOT NULL DEFAULT 70,
    time_limit_min  integer,
    points_reward   integer         NOT NULL DEFAULT 30,
    position_filter text[],
    is_published    boolean         NOT NULL DEFAULT false,
    created_by      uuid            REFERENCES profiles(id) ON DELETE SET NULL,
    created_at      timestamptz     NOT NULL DEFAULT now(),
    updated_at      timestamptz     NOT NULL DEFAULT now()
);

CREATE TABLE pl_game_items (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id         uuid        NOT NULL REFERENCES pl_games(id) ON DELETE CASCADE,
    sort_order      integer     NOT NULL DEFAULT 0,
    prompt          text        NOT NULL,
    answer          text        NOT NULL,           -- correct answer (server-only)
    options         jsonb,                          -- ["A","B","C","D"]
    drive_file_id   uuid        REFERENCES drive_files(id) ON DELETE SET NULL,
    explanation     text,
    points          integer     NOT NULL DEFAULT 1,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pl_attempts (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    game_id         uuid        NOT NULL REFERENCES pl_games(id) ON DELETE CASCADE,
    score           integer,
    passed          boolean,
    points_earned   integer,
    submitted_at    timestamptz,
    status          text        NOT NULL DEFAULT 'IN_PROGRESS'
                    CHECK (status IN ('IN_PROGRESS','COMPLETED','ABANDONED')),
    started_at      timestamptz NOT NULL DEFAULT now(),
    created_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pl_attempts_one_active UNIQUE (user_id, game_id)
        DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX idx_pl_items_game ON pl_game_items(game_id, sort_order);
CREATE INDEX idx_pl_attempts   ON pl_attempts(user_id, game_id);

-- ══════════════════════════════════════════════════════════════
-- LETS PRACTICE
-- Links to operational resources (Drive, Docs, Sheets, external).
-- ══════════════════════════════════════════════════════════════

CREATE TYPE lp_resource_type AS ENUM (
    'GOOGLE_DOCS',
    'GOOGLE_SHEETS',
    'GOOGLE_SLIDES',
    'DRIVE_FILE',
    'EXTERNAL_URL',
    'EMBEDDED_FORM'
);

CREATE TABLE lp_practices (
    id              uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
    sort_order      integer             NOT NULL DEFAULT 0,
    title           text                NOT NULL,
    description     text,
    resource_type   lp_resource_type    NOT NULL,
    resource_url    text,
    drive_file_id   uuid                REFERENCES drive_files(id) ON DELETE SET NULL,
    estimated_min   integer,
    position_filter text[],
    is_published    boolean             NOT NULL DEFAULT false,
    created_by      uuid                REFERENCES profiles(id) ON DELETE SET NULL,
    created_at      timestamptz         NOT NULL DEFAULT now(),
    updated_at      timestamptz         NOT NULL DEFAULT now()
);

CREATE TABLE lp_completions (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    practice_id     uuid        NOT NULL REFERENCES lp_practices(id) ON DELETE CASCADE,
    completed_at    timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, practice_id)
);

CREATE INDEX idx_lp_practices ON lp_practices(sort_order);

-- ══════════════════════════════════════════════════════════════
-- TANYA JAWAB (QnA)
-- Questions with Drive attachments; admin verification of answers.
-- ══════════════════════════════════════════════════════════════

CREATE TABLE qna_questions (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id       uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title           text        NOT NULL,
    body            text,
    is_published    boolean     NOT NULL DEFAULT true,
    is_resolved     boolean     NOT NULL DEFAULT false,
    view_count      integer     NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE qna_attachments (
    id              uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id     uuid            NOT NULL REFERENCES qna_questions(id) ON DELETE CASCADE,
    drive_file_id   uuid            NOT NULL REFERENCES drive_files(id) ON DELETE CASCADE,
    attachment_type attachment_type NOT NULL,
    display_name    text,
    sequence        integer         NOT NULL DEFAULT 0,
    created_at      timestamptz     NOT NULL DEFAULT now()
);

CREATE TABLE qna_answers (
    id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id         uuid        NOT NULL REFERENCES qna_questions(id) ON DELETE CASCADE,
    author_id           uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    body                text        NOT NULL,
    is_verified         boolean     NOT NULL DEFAULT false,
    verified_by         uuid        REFERENCES profiles(id) ON DELETE SET NULL,
    verified_at         timestamptz,
    is_accepted         boolean     NOT NULL DEFAULT false,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE qna_votes (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    answer_id       uuid        NOT NULL REFERENCES qna_answers(id) ON DELETE CASCADE,
    vote_type       text        NOT NULL DEFAULT 'UP' CHECK (vote_type IN ('UP','DOWN')),
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, answer_id)
);

CREATE INDEX idx_qna_questions_author ON qna_questions(author_id);
CREATE INDEX idx_qna_questions_pub    ON qna_questions(is_published, created_at DESC);
CREATE INDEX idx_qna_answers_q        ON qna_answers(question_id);
CREATE INDEX idx_qna_attachments_q    ON qna_attachments(question_id);

-- ══════════════════════════════════════════════════════════════
-- RUANG ASPIRASI (Feedback / Aspirations)
-- Anonymous-optional staff feedback with file attachment support.
-- ══════════════════════════════════════════════════════════════

CREATE TYPE asp_status AS ENUM ('SUBMITTED','REVIEWED','IN_PROGRESS','RESOLVED','DISMISSED');
CREATE TYPE asp_category AS ENUM ('SARAN','KELUHAN','IDE','APRESIASI','LAINNYA');

CREATE TABLE asp_submissions (
    id              uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id       uuid            REFERENCES profiles(id) ON DELETE SET NULL, -- nullable = anonymous
    is_anonymous    boolean         NOT NULL DEFAULT false,
    category        asp_category    NOT NULL DEFAULT 'SARAN',
    title           text            NOT NULL,
    body            text            NOT NULL,
    status          asp_status      NOT NULL DEFAULT 'SUBMITTED',
    admin_response  text,
    responded_by    uuid            REFERENCES profiles(id) ON DELETE SET NULL,
    responded_at    timestamptz,
    drive_file_id   uuid            REFERENCES drive_files(id) ON DELETE SET NULL,
    created_at      timestamptz     NOT NULL DEFAULT now(),
    updated_at      timestamptz     NOT NULL DEFAULT now()
);

CREATE INDEX idx_asp_status   ON asp_submissions(status, created_at DESC);
CREATE INDEX idx_asp_author   ON asp_submissions(author_id);

-- ══════════════════════════════════════════════════════════════
-- FRESH UPDATE
-- News / announcements with rich content + Drive attachments.
-- ══════════════════════════════════════════════════════════════

CREATE TABLE fu_posts (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    title           text        NOT NULL,
    summary         text,
    body            text,                   -- rich text HTML
    cover_drive_file_id uuid    REFERENCES drive_files(id) ON DELETE SET NULL,
    is_published    boolean     NOT NULL DEFAULT false,
    published_at    timestamptz,
    position_filter text[],
    created_by      uuid        REFERENCES profiles(id) ON DELETE SET NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE fu_attachments (
    id              uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id         uuid            NOT NULL REFERENCES fu_posts(id) ON DELETE CASCADE,
    drive_file_id   uuid            NOT NULL REFERENCES drive_files(id) ON DELETE CASCADE,
    attachment_type attachment_type NOT NULL,
    display_name    text,
    sequence        integer         NOT NULL DEFAULT 0,
    created_at      timestamptz     NOT NULL DEFAULT now()
);

CREATE TABLE fu_reads (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    post_id         uuid        NOT NULL REFERENCES fu_posts(id) ON DELETE CASCADE,
    read_at         timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, post_id)
);

CREATE INDEX idx_fu_posts_pub       ON fu_posts(is_published, published_at DESC);
CREATE INDEX idx_fu_attachments     ON fu_attachments(post_id, sequence);
CREATE INDEX idx_fu_reads           ON fu_reads(user_id);

-- ══════════════════════════════════════════════════════════════
-- NOTIFICATIONS
-- In-app notification feed. Append-only; marked read per user.
-- ══════════════════════════════════════════════════════════════

CREATE TYPE notification_type AS ENUM (
    'POINTS_EARNED',
    'BADGE_EARNED',
    'CERTIFICATE_ISSUED',
    'QNA_ANSWER',
    'QNA_VERIFIED',
    'FRESH_UPDATE',
    'ASPIRATION_RESPONSE',
    'SYSTEM'
);

CREATE TABLE notifications (
    id              uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid                NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type            notification_type   NOT NULL,
    title           text                NOT NULL,
    body            text,
    action_url      text,               -- deep link inside ALC
    is_read         boolean             NOT NULL DEFAULT false,
    created_at      timestamptz         NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user   ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- ── updated_at triggers ─────────────────────────────────────

CREATE TRIGGER set_pk_categories_updated_at BEFORE UPDATE ON pk_categories FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_pk_topics_updated_at     BEFORE UPDATE ON pk_topics     FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_pk_sections_updated_at   BEFORE UPDATE ON pk_sections   FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_pl_games_updated_at      BEFORE UPDATE ON pl_games      FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_qna_questions_updated_at BEFORE UPDATE ON qna_questions FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_qna_answers_updated_at   BEFORE UPDATE ON qna_answers   FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_lp_practices_updated_at  BEFORE UPDATE ON lp_practices  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_fu_posts_updated_at      BEFORE UPDATE ON fu_posts      FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_asp_submissions_updated_at BEFORE UPDATE ON asp_submissions FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
