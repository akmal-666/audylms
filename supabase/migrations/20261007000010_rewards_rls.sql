-- ============================================================
-- Rewards — RLS Policies
-- 20261007000010_rewards_rls.sql
-- ============================================================

ALTER TABLE point_rules            ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE levels                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges            ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_templates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates           ENABLE ROW LEVEL SECURITY;

-- ── Point Rules ───────────────────────────────────────────────
-- All authenticated users can read (needed to display point info).
-- Only admins can modify.

CREATE POLICY "point_rules: authenticated read"
    ON point_rules FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "point_rules: admins read all"
    ON point_rules FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "point_rules: admins write"
    ON point_rules FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "point_rules: admins update"
    ON point_rules FOR UPDATE TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());

-- ── Point Transactions ────────────────────────────────────────
-- Users can only read their own transactions.
-- INSERT is done server-side via service role (bypasses RLS).
-- No UPDATE or DELETE ever — append-only ledger.

CREATE POLICY "point_transactions: own read"
    ON point_transactions FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "point_transactions: admins read all"
    ON point_transactions FOR SELECT TO authenticated USING (is_admin());

-- No INSERT policy for authenticated role.
-- All awards are done server-side with the service role key.

-- ── Levels ────────────────────────────────────────────────────

CREATE POLICY "levels: authenticated read"
    ON levels FOR SELECT TO authenticated USING (true);

CREATE POLICY "levels: admins write"
    ON levels FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "levels: admins update"
    ON levels FOR UPDATE TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());

-- ── Badges ────────────────────────────────────────────────────

CREATE POLICY "badges: authenticated read active"
    ON badges FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "badges: admins read all"
    ON badges FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "badges: admins write"
    ON badges FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "badges: admins update"
    ON badges FOR UPDATE TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());

-- ── User Badges ───────────────────────────────────────────────

CREATE POLICY "user_badges: own read"
    ON user_badges FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "user_badges: admins read all"
    ON user_badges FOR SELECT TO authenticated USING (is_admin());

-- Awarded server-side only.

-- ── Certificate Templates ─────────────────────────────────────
-- Employees don't need to read templates directly.
-- Templates are read server-side when generating certificates.

CREATE POLICY "certificate_templates: admins read"
    ON certificate_templates FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "certificate_templates: admins write"
    ON certificate_templates FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "certificate_templates: admins update"
    ON certificate_templates FOR UPDATE TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());

-- ── Certificates ──────────────────────────────────────────────
-- Employees can read only their own certificates.
-- Admins can read all.
-- INSERT / UPDATE done server-side only (service role).

CREATE POLICY "certificates: own read"
    ON certificates FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "certificates: admins read all"
    ON certificates FOR SELECT TO authenticated USING (is_admin());

-- Public verification endpoint (anon can verify by code, no auth needed)
CREATE POLICY "certificates: public verify by code"
    ON certificates FOR SELECT TO anon
    USING (true);  -- filtered in app layer by verification_code
