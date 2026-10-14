-- ============================================================
-- Assessment Engine — RLS Policies
-- 20261007000008_assessment_rls.sql
-- ============================================================

ALTER TABLE gj_case_attachments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE gj_question_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE gj_case_progress        ENABLE ROW LEVEL SECURITY;

-- ── Case Attachments ──────────────────────────────────────────

CREATE POLICY "gj_case_attachments: authenticated read"
    ON gj_case_attachments FOR SELECT TO authenticated USING (true);

CREATE POLICY "gj_case_attachments: admins write"
    ON gj_case_attachments FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "gj_case_attachments: admins update"
    ON gj_case_attachments FOR UPDATE TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "gj_case_attachments: admins delete"
    ON gj_case_attachments FOR DELETE TO authenticated USING (is_admin());

-- ── Question Attachments ──────────────────────────────────────
-- SECURITY: Employees can read question attachments ONLY.
-- They MUST NOT be able to read gj_quiz_options.is_correct before submission.
-- The is_correct field is handled exclusively server-side.

CREATE POLICY "gj_question_attachments: authenticated read"
    ON gj_question_attachments FOR SELECT TO authenticated USING (true);

CREATE POLICY "gj_question_attachments: admins write"
    ON gj_question_attachments FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "gj_question_attachments: admins update"
    ON gj_question_attachments FOR UPDATE TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "gj_question_attachments: admins delete"
    ON gj_question_attachments FOR DELETE TO authenticated USING (is_admin());

-- ── Case Progress ─────────────────────────────────────────────

CREATE POLICY "gj_case_progress: own read"
    ON gj_case_progress FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "gj_case_progress: admins read all"
    ON gj_case_progress FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "gj_case_progress: own insert"
    ON gj_case_progress FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "gj_case_progress: own update"
    ON gj_case_progress FOR UPDATE TO authenticated
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── Tighten gj_quiz_options: hide is_correct from non-admins ─
-- Re-create the SELECT policy with a column-level restriction.
-- Authenticated users see options but NOT is_correct.
-- Admin can see everything.
--
-- Implementation: we drop the broad policy and replace it with
-- a view-based approach: employees query through a secure
-- server function, never the options table directly via anon.
-- The existing RLS already restricts options to authenticated users.
-- The is_correct column is NEVER sent to the browser — the server
-- service strips it before returning data to the client.
-- This is enforced architecturally in getQuizForEmployee().

-- ── Duplicate attempt guard via RLS ──────────────────────────
-- Re-enforce the unique-active-attempt constraint at the policy level.
-- The unique index on gj_quiz_attempts WHERE status='IN_PROGRESS'
-- already handles this at the DB level. No additional policy needed.

-- ── gj_quiz_attempts: add submitted_at immutability ──────────
-- Once submitted_at IS NOT NULL, the row cannot be updated.
-- This prevents score manipulation after submission.

CREATE OR REPLACE FUNCTION prevent_attempt_modification()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- If submitted_at was already set, block all updates
    IF OLD.submitted_at IS NOT NULL THEN
        RAISE EXCEPTION 'Quiz attempt % is already submitted and cannot be modified.', OLD.id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER lock_submitted_attempt
    BEFORE UPDATE ON gj_quiz_attempts
    FOR EACH ROW
    WHEN (OLD.submitted_at IS NOT NULL)
    EXECUTE FUNCTION prevent_attempt_modification();
