-- ============================================================
-- Growth Journey RLS Policies
-- 20261007000006_growth_journey_rls.sql
-- ============================================================

ALTER TABLE gj_stages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE gj_materials         ENABLE ROW LEVEL SECURITY;
ALTER TABLE gj_material_content  ENABLE ROW LEVEL SECURITY;
ALTER TABLE gj_cases             ENABLE ROW LEVEL SECURITY;
ALTER TABLE gj_quizzes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE gj_quiz_questions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE gj_quiz_options      ENABLE ROW LEVEL SECURITY;
ALTER TABLE gj_attachments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE gj_user_progress     ENABLE ROW LEVEL SECURITY;
ALTER TABLE gj_material_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE gj_quiz_attempts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE gj_quiz_answers      ENABLE ROW LEVEL SECURITY;

-- ── Helper: caller's position ────────────────────────────────

CREATE OR REPLACE FUNCTION caller_position()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
    SELECT p.name::text
    FROM profiles pr
    JOIN positions p ON p.id = pr.position_id
    WHERE pr.id = auth.uid()
    LIMIT 1;
$$;

-- ── Stages ───────────────────────────────────────────────────
-- Staff see published stages where their position matches OR no filter.

CREATE POLICY "gj_stages: staff read published visible"
    ON gj_stages FOR SELECT TO authenticated
    USING (
        is_published = true
        AND (
            position_filter IS NULL
            OR array_length(position_filter, 1) = 0
            OR caller_position() = ANY(position_filter)
        )
    );

CREATE POLICY "gj_stages: admins read all"
    ON gj_stages FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "gj_stages: admins write"
    ON gj_stages FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "gj_stages: admins update"
    ON gj_stages FOR UPDATE TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "gj_stages: admins delete"
    ON gj_stages FOR DELETE TO authenticated USING (is_admin());

-- ── Materials ─────────────────────────────────────────────────

CREATE POLICY "gj_materials: staff read published"
    ON gj_materials FOR SELECT TO authenticated
    USING (is_published = true);

CREATE POLICY "gj_materials: admins read all"
    ON gj_materials FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "gj_materials: admins write"
    ON gj_materials FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "gj_materials: admins update"
    ON gj_materials FOR UPDATE TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "gj_materials: admins delete"
    ON gj_materials FOR DELETE TO authenticated USING (is_admin());

-- ── Material Content ──────────────────────────────────────────

CREATE POLICY "gj_material_content: authenticated read"
    ON gj_material_content FOR SELECT TO authenticated USING (true);

CREATE POLICY "gj_material_content: admins write"
    ON gj_material_content FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "gj_material_content: admins update"
    ON gj_material_content FOR UPDATE TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "gj_material_content: admins delete"
    ON gj_material_content FOR DELETE TO authenticated USING (is_admin());

-- ── Cases ─────────────────────────────────────────────────────

CREATE POLICY "gj_cases: staff read published"
    ON gj_cases FOR SELECT TO authenticated USING (is_published = true);

CREATE POLICY "gj_cases: admins read all"
    ON gj_cases FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "gj_cases: admins write"
    ON gj_cases FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "gj_cases: admins update"
    ON gj_cases FOR UPDATE TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "gj_cases: admins delete"
    ON gj_cases FOR DELETE TO authenticated USING (is_admin());

-- ── Quizzes ───────────────────────────────────────────────────

CREATE POLICY "gj_quizzes: staff read published"
    ON gj_quizzes FOR SELECT TO authenticated USING (is_published = true);

CREATE POLICY "gj_quizzes: admins read all"
    ON gj_quizzes FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "gj_quizzes: admins write"
    ON gj_quizzes FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "gj_quizzes: admins update"
    ON gj_quizzes FOR UPDATE TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "gj_quizzes: admins delete"
    ON gj_quizzes FOR DELETE TO authenticated USING (is_admin());

-- Questions & options — same pattern

CREATE POLICY "gj_quiz_questions: authenticated read"
    ON gj_quiz_questions FOR SELECT TO authenticated USING (true);

CREATE POLICY "gj_quiz_questions: admins write"
    ON gj_quiz_questions FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "gj_quiz_questions: admins update"
    ON gj_quiz_questions FOR UPDATE TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "gj_quiz_questions: admins delete"
    ON gj_quiz_questions FOR DELETE TO authenticated USING (is_admin());

CREATE POLICY "gj_quiz_options: authenticated read"
    ON gj_quiz_options FOR SELECT TO authenticated USING (true);

CREATE POLICY "gj_quiz_options: admins write"
    ON gj_quiz_options FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "gj_quiz_options: admins update"
    ON gj_quiz_options FOR UPDATE TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "gj_quiz_options: admins delete"
    ON gj_quiz_options FOR DELETE TO authenticated USING (is_admin());

-- ── Attachments ───────────────────────────────────────────────

CREATE POLICY "gj_attachments: authenticated read"
    ON gj_attachments FOR SELECT TO authenticated USING (true);

CREATE POLICY "gj_attachments: admins write"
    ON gj_attachments FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "gj_attachments: admins update"
    ON gj_attachments FOR UPDATE TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "gj_attachments: admins delete"
    ON gj_attachments FOR DELETE TO authenticated USING (is_admin());

-- ── User Progress ─────────────────────────────────────────────

CREATE POLICY "gj_user_progress: own read"
    ON gj_user_progress FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "gj_user_progress: admins read all"
    ON gj_user_progress FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "gj_user_progress: own upsert"
    ON gj_user_progress FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "gj_user_progress: own update"
    ON gj_user_progress FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ── Material Progress ─────────────────────────────────────────

CREATE POLICY "gj_material_progress: own read"
    ON gj_material_progress FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "gj_material_progress: admins read all"
    ON gj_material_progress FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "gj_material_progress: own upsert"
    ON gj_material_progress FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "gj_material_progress: own update"
    ON gj_material_progress FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ── Quiz Attempts ─────────────────────────────────────────────

CREATE POLICY "gj_quiz_attempts: own read"
    ON gj_quiz_attempts FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "gj_quiz_attempts: admins read all"
    ON gj_quiz_attempts FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "gj_quiz_attempts: own insert"
    ON gj_quiz_attempts FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "gj_quiz_attempts: own update"
    ON gj_quiz_attempts FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ── Quiz Answers ──────────────────────────────────────────────

CREATE POLICY "gj_quiz_answers: own read"
    ON gj_quiz_answers FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM gj_quiz_attempts a
            WHERE a.id = attempt_id AND a.user_id = auth.uid()
        )
    );

CREATE POLICY "gj_quiz_answers: own insert"
    ON gj_quiz_answers FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM gj_quiz_attempts a
            WHERE a.id = attempt_id AND a.user_id = auth.uid()
        )
    );
