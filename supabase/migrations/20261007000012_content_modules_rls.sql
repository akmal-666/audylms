-- ============================================================
-- Phase 6 — Content Modules RLS
-- 20261007000012_content_modules_rls.sql
-- ============================================================

ALTER TABLE pk_categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE pk_topics          ENABLE ROW LEVEL SECURITY;
ALTER TABLE pk_sections        ENABLE ROW LEVEL SECURITY;
ALTER TABLE pk_progress        ENABLE ROW LEVEL SECURITY;
ALTER TABLE pl_games           ENABLE ROW LEVEL SECURITY;
ALTER TABLE pl_game_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE pl_attempts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE lp_practices       ENABLE ROW LEVEL SECURITY;
ALTER TABLE lp_completions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE qna_questions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE qna_attachments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE qna_answers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE qna_votes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE asp_submissions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE fu_posts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE fu_attachments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE fu_reads           ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;

-- ── Product Knowledge ─────────────────────────────────────────

CREATE POLICY "pk_categories: staff read published" ON pk_categories FOR SELECT TO authenticated
    USING (is_published = true AND (position_filter IS NULL OR array_length(position_filter,1)=0 OR caller_position()=ANY(position_filter)));
CREATE POLICY "pk_categories: admins all"  ON pk_categories FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "pk_topics: staff read published" ON pk_topics FOR SELECT TO authenticated USING (is_published = true);
CREATE POLICY "pk_topics: admins all"       ON pk_topics     FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "pk_sections: authenticated read" ON pk_sections FOR SELECT TO authenticated USING (true);
CREATE POLICY "pk_sections: admins write"   ON pk_sections  FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "pk_sections: admins update"  ON pk_sections  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "pk_sections: admins delete"  ON pk_sections  FOR DELETE TO authenticated USING (is_admin());

CREATE POLICY "pk_progress: own read"   ON pk_progress FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE POLICY "pk_progress: admins read" ON pk_progress FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "pk_progress: own insert" ON pk_progress FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid());
CREATE POLICY "pk_progress: own update" ON pk_progress FOR UPDATE TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());

-- ── Play & Learn ───────────────────────────────────────────────

CREATE POLICY "pl_games: staff read published" ON pl_games FOR SELECT TO authenticated
    USING (is_published=true AND (position_filter IS NULL OR array_length(position_filter,1)=0 OR caller_position()=ANY(position_filter)));
CREATE POLICY "pl_games: admins all" ON pl_games FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Items: staff see them but answer is stripped server-side; admins manage
CREATE POLICY "pl_game_items: authenticated read" ON pl_game_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "pl_game_items: admins write"  ON pl_game_items FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "pl_game_items: admins update" ON pl_game_items FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "pl_game_items: admins delete" ON pl_game_items FOR DELETE TO authenticated USING (is_admin());

CREATE POLICY "pl_attempts: own read"   ON pl_attempts FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE POLICY "pl_attempts: admins read" ON pl_attempts FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "pl_attempts: own insert" ON pl_attempts FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid());
CREATE POLICY "pl_attempts: own update" ON pl_attempts FOR UPDATE TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());

-- ── Lets Practice ──────────────────────────────────────────────

CREATE POLICY "lp_practices: staff read published" ON lp_practices FOR SELECT TO authenticated
    USING (is_published=true AND (position_filter IS NULL OR array_length(position_filter,1)=0 OR caller_position()=ANY(position_filter)));
CREATE POLICY "lp_practices: admins all" ON lp_practices FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "lp_completions: own read"   ON lp_completions FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE POLICY "lp_completions: own insert" ON lp_completions FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid());

-- ── Tanya Jawab ────────────────────────────────────────────────

CREATE POLICY "qna_questions: authenticated read published" ON qna_questions FOR SELECT TO authenticated USING (is_published=true);
CREATE POLICY "qna_questions: admins read all" ON qna_questions FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "qna_questions: own insert" ON qna_questions FOR INSERT TO authenticated WITH CHECK (author_id=auth.uid());
CREATE POLICY "qna_questions: own update" ON qna_questions FOR UPDATE TO authenticated USING (author_id=auth.uid() OR is_admin());
CREATE POLICY "qna_questions: admins delete" ON qna_questions FOR DELETE TO authenticated USING (is_admin());

CREATE POLICY "qna_attachments: authenticated read" ON qna_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "qna_attachments: admins write" ON qna_attachments FOR INSERT TO authenticated WITH CHECK (is_admin() OR EXISTS(SELECT 1 FROM qna_questions WHERE id=question_id AND author_id=auth.uid()));
CREATE POLICY "qna_attachments: admins delete" ON qna_attachments FOR DELETE TO authenticated USING (is_admin());

CREATE POLICY "qna_answers: authenticated read" ON qna_answers FOR SELECT TO authenticated USING (true);
CREATE POLICY "qna_answers: own insert"  ON qna_answers FOR INSERT TO authenticated WITH CHECK (author_id=auth.uid());
CREATE POLICY "qna_answers: own or admin update" ON qna_answers FOR UPDATE TO authenticated USING (author_id=auth.uid() OR is_admin());
CREATE POLICY "qna_answers: admins delete" ON qna_answers FOR DELETE TO authenticated USING (is_admin());

CREATE POLICY "qna_votes: own read"   ON qna_votes FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE POLICY "qna_votes: own insert" ON qna_votes FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid());
CREATE POLICY "qna_votes: own delete" ON qna_votes FOR DELETE TO authenticated USING (user_id=auth.uid());

-- ── Ruang Aspirasi ─────────────────────────────────────────────

-- Anonymous submissions: author_id may be null; staff can always read own
CREATE POLICY "asp_submissions: own read" ON asp_submissions FOR SELECT TO authenticated
    USING (is_admin() OR (NOT is_anonymous AND author_id=auth.uid()));
CREATE POLICY "asp_submissions: authenticated insert" ON asp_submissions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "asp_submissions: admins update" ON asp_submissions FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ── Fresh Update ───────────────────────────────────────────────

CREATE POLICY "fu_posts: staff read published" ON fu_posts FOR SELECT TO authenticated
    USING (is_published=true AND (position_filter IS NULL OR array_length(position_filter,1)=0 OR caller_position()=ANY(position_filter)));
CREATE POLICY "fu_posts: admins all" ON fu_posts FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "fu_attachments: authenticated read" ON fu_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "fu_attachments: admins write"  ON fu_attachments FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "fu_attachments: admins delete" ON fu_attachments FOR DELETE TO authenticated USING (is_admin());

CREATE POLICY "fu_reads: own read"   ON fu_reads FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE POLICY "fu_reads: own insert" ON fu_reads FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid());
CREATE POLICY "fu_reads: own update" ON fu_reads FOR UPDATE TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());

-- ── Notifications ──────────────────────────────────────────────

CREATE POLICY "notifications: own read"   ON notifications FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE POLICY "notifications: own update" ON notifications FOR UPDATE TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
-- INSERT via service role only (server-side).
