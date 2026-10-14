-- ============================================================
-- ALC Initial Schema Migration
-- 20261007000001_initial_schema.sql
--
-- Creates:
--   - Enums: user_role, user_position
--   - Tables: departments, positions, profiles, system_settings, audit_logs
--   - Indexes
--   - updated_at triggers
--   - auto-create profile on auth.users insert trigger
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('ADMIN', 'STAFF');

CREATE TYPE user_position AS ENUM ('RESEPSIONIS', 'PERAWAT_GIGI', 'SUPERVISOR');

-- ============================================================
-- DEPARTMENTS
-- Reference table for clinic departments.
-- ============================================================

CREATE TABLE departments (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text NOT NULL,
    description text,
    is_active   boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT departments_name_unique UNIQUE (name)
);

-- ============================================================
-- POSITIONS
-- Reference table for staff positions.
-- NOTE: position is a content filter, NOT an auth mechanism.
-- ============================================================

CREATE TABLE positions (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        user_position NOT NULL UNIQUE,
    label       text NOT NULL,
    description text,
    is_active   boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- PROFILES
-- Extends Supabase auth.users.
-- One row per authenticated user.
-- id is the same as auth.users.id — this is a 1:1 relationship.
-- ============================================================

CREATE TABLE profiles (
    id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_code   text UNIQUE,
    full_name       text NOT NULL,
    username        text UNIQUE,
    email           text NOT NULL,
    phone           text,
    department_id   uuid REFERENCES departments(id) ON DELETE SET NULL,
    position_id     uuid REFERENCES positions(id) ON DELETE SET NULL,
    role            user_role NOT NULL DEFAULT 'STAFF',
    avatar_url      text,
    is_active       boolean NOT NULL DEFAULT true,
    last_login_at   timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- SYSTEM SETTINGS
-- Key-value store for application configuration.
-- ============================================================

CREATE TABLE system_settings (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key         text NOT NULL UNIQUE,
    value       text NOT NULL,
    description text,
    is_public   boolean NOT NULL DEFAULT false,
    updated_by  uuid REFERENCES profiles(id) ON DELETE SET NULL,
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- AUDIT LOGS
-- Append-only log of significant actions.
-- Written by server-side code using the service role key.
-- Never written by the anon client.
-- ============================================================

CREATE TABLE audit_logs (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid REFERENCES profiles(id) ON DELETE SET NULL,
    action      text NOT NULL,
    table_name  text,
    record_id   uuid,
    old_data    jsonb,
    new_data    jsonb,
    ip_address  text,
    user_agent  text,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_profiles_role         ON profiles(role);
CREATE INDEX idx_profiles_position_id  ON profiles(position_id);
CREATE INDEX idx_profiles_department_id ON profiles(department_id);
CREATE INDEX idx_profiles_is_active    ON profiles(is_active);
CREATE INDEX idx_audit_logs_user_id    ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action     ON audit_logs(action);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON NEW USER
-- When a new user signs up via Supabase Auth, automatically
-- create a profiles row with defaults.
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        role
    ) VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            split_part(NEW.email, '@', 1)
        ),
        NEW.email,
        COALESCE(
            (NEW.raw_user_meta_data->>'role')::user_role,
            'STAFF'
        )
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();
