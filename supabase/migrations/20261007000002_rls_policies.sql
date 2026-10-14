-- ============================================================
-- ALC Row Level Security Policies
-- 20261007000002_rls_policies.sql
--
-- Strategy:
--   1. Enable RLS on every table (deny everything by default)
--   2. Add explicit allow policies per table per operation
--
-- Helper functions:
--   auth.uid()              — current user's uuid
--   auth.role()             — 'authenticated' | 'anon' | 'service_role'
--
-- Custom helper:
--   is_admin()              — true if caller's profile.role = 'ADMIN'
-- ============================================================

-- ============================================================
-- HELPER: is_admin()
-- Looks up the caller's role in the profiles table.
-- Returns false if the caller has no profile (e.g., anon).
-- ============================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
          AND role = 'ADMIN'
          AND is_active = true
    );
$$;

-- ============================================================
-- ENABLE RLS — all tables default-deny
-- ============================================================

ALTER TABLE departments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs       ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- DEPARTMENTS
-- All authenticated users can read.
-- Only admins can write.
-- ============================================================

CREATE POLICY "departments: authenticated users can read"
    ON departments FOR SELECT
    TO authenticated
    USING (is_active = true);

CREATE POLICY "departments: admins can insert"
    ON departments FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "departments: admins can update"
    ON departments FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "departments: admins can delete"
    ON departments FOR DELETE
    TO authenticated
    USING (is_admin());

-- ============================================================
-- POSITIONS
-- All authenticated users can read.
-- Only admins can write.
-- ============================================================

CREATE POLICY "positions: authenticated users can read"
    ON positions FOR SELECT
    TO authenticated
    USING (is_active = true);

CREATE POLICY "positions: admins can insert"
    ON positions FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "positions: admins can update"
    ON positions FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "positions: admins can delete"
    ON positions FOR DELETE
    TO authenticated
    USING (is_admin());

-- ============================================================
-- PROFILES
--
-- SELECT:
--   - Users can read their own profile.
--   - Admins can read all profiles.
--
-- UPDATE:
--   - Users can update limited fields on their own profile
--     (avatar, phone — not role, not is_active).
--   - Admins can update any profile.
--
-- INSERT:
--   - Service role only (via the auth trigger function).
--     We don't allow anon/authenticated insert directly.
--
-- DELETE:
--   - Admin only.
-- ============================================================

CREATE POLICY "profiles: users can read own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "profiles: admins can read all profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (is_admin());

CREATE POLICY "profiles: users can update own safe fields"
    ON profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (
        -- Users cannot promote themselves or deactivate others
        id = auth.uid()
        AND role = (SELECT role FROM profiles WHERE id = auth.uid())
        AND is_active = (SELECT is_active FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "profiles: admins can update any profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "profiles: admins can delete profiles"
    ON profiles FOR DELETE
    TO authenticated
    USING (is_admin());

-- ============================================================
-- SYSTEM SETTINGS
--
-- Public settings: any authenticated user can read.
-- Private settings: admins only.
-- Write: admins only.
-- ============================================================

CREATE POLICY "system_settings: authenticated can read public settings"
    ON system_settings FOR SELECT
    TO authenticated
    USING (is_public = true);

CREATE POLICY "system_settings: admins can read all settings"
    ON system_settings FOR SELECT
    TO authenticated
    USING (is_admin());

CREATE POLICY "system_settings: admins can insert"
    ON system_settings FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "system_settings: admins can update"
    ON system_settings FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "system_settings: admins can delete"
    ON system_settings FOR DELETE
    TO authenticated
    USING (is_admin());

-- ============================================================
-- AUDIT LOGS
--
-- SELECT: admins only.
-- INSERT: service role only (done via server-side admin client).
--   We do NOT add an authenticated INSERT policy.
--   Anon and authenticated users CANNOT write audit logs directly.
-- UPDATE/DELETE: nobody (append-only).
-- ============================================================

CREATE POLICY "audit_logs: admins can read"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (is_admin());

-- No INSERT/UPDATE/DELETE policies for authenticated users.
-- Server-side code uses the service role key which bypasses RLS.
