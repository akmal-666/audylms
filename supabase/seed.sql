-- ============================================================
-- ALC Development Seed Data
-- seed.sql
--
-- DO NOT use production credentials here.
-- These are development-only dummy records.
--
-- IMPORTANT: Run migrations first before seeding.
--
-- To create auth users for testing, use the Supabase dashboard
-- or supabase CLI:
--   supabase auth admin create-user --email admin@alc.dev --password dev123456
-- Then update the profiles row with the generated auth UUID.
-- ============================================================

-- ============================================================
-- DEPARTMENTS
-- ============================================================

INSERT INTO departments (id, name, description, is_active) VALUES
    ('dept-0000-0000-0001', 'Front Office',   'Resepsionis dan customer service', true),
    ('dept-0000-0000-0002', 'Klinik',         'Tenaga medis dan perawat gigi',    true),
    ('dept-0000-0000-0003', 'Manajemen',      'Supervisor dan pengelola klinik',   true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- POSITIONS
-- These match the user_position enum exactly.
-- ============================================================

INSERT INTO positions (id, name, label, description, is_active) VALUES
    ('pos-00000-0000-0001', 'RESEPSIONIS',   'Resepsionis',   'Staff front office dan penerimaan pasien',      true),
    ('pos-00000-0000-0002', 'PERAWAT_GIGI',  'Perawat Gigi',  'Tenaga kesehatan gigi terlatih',                true),
    ('pos-00000-0000-0003', 'SUPERVISOR',    'Supervisor',    'Pengawas operasional dan jaminan kualitas',     true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SYSTEM SETTINGS
-- Default application configuration.
-- ============================================================

INSERT INTO system_settings (key, value, description, is_public) VALUES
    ('app.name',                  'Audy Learning Centre', 'Nama aplikasi',                           true),
    ('app.version',               '1.0.0',                'Versi aplikasi',                          true),
    ('app.maintenance',           'false',                'Mode pemeliharaan',                        false),
    ('points.login_bonus',        '10',                   'Poin bonus masuk per hari',               false),
    ('file.max_size_bytes',       '3145728',              'Ukuran maksimum file upload (bytes = 3MB)', false),
    ('file.allowed_mime_types',   'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation',
                                  'MIME types yang diizinkan untuk upload', false)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- NOTES FOR DEVELOPMENT USERS
-- ============================================================
-- To add dev users:
-- 1. Go to your Supabase project → Authentication → Users → Add user
-- 2. Or use: supabase auth admin createuser (with CLI)
-- 3. The trigger handle_new_auth_user() will auto-create the profile.
-- 4. Then UPDATE the profile to set role, department_id, position_id.
--
-- Example after creating user with UUID '00000000-0000-0000-0000-000000000001':
--
-- UPDATE profiles SET
--     full_name     = 'Admin ALC',
--     employee_code = 'ALC-001',
--     role          = 'ADMIN',
--     department_id = 'dept-0000-0000-0003',
--     position_id   = 'pos-00000-0000-0003'
-- WHERE id = '00000000-0000-0000-0000-000000000001';
--
-- ============================================================

-- ============================================================
-- GROWTH JOURNEY — Seed Stages
-- ============================================================

INSERT INTO gj_stages (id, sort_order, title, description, icon, estimated_min, points_reward, is_published) VALUES
    ('gj-stage-0000-0000-0001', 1,  'Start Your Journey 😍',   'Mulai perjalanan belajarmu di sini. Pelajari dasar-dasar peran dan lingkungan kerja Audy.',           '🌱', 30, 50,  true),
    ('gj-stage-0000-0000-0002', 2,  'Level Up Your Role',      'Tingkatkan kemampuanmu. Pelajari prosedur kerja, standar layanan, dan keterampilan inti.',            '⬆️', 45, 100, true),
    ('gj-stage-0000-0000-0003', 3,  'The Real Power Team',     'Bekerja sebagai tim yang solid. Pelajari kolaborasi, komunikasi efektif, dan sinergi tim.',           '💪', 60, 150, true),
    ('gj-stage-0000-0000-0004', 4,  'Leadership Excellence',   'Kembangkan jiwa kepemimpinan. Pelajari manajemen, mentoring, dan pengambilan keputusan strategis.',   '🏆', 60, 200, true)
ON CONFLICT (id) DO NOTHING;

-- Sample material for Stage 1
INSERT INTO gj_materials (id, stage_id, sort_order, title, summary, estimated_min, is_required, is_published) VALUES
    ('gj-mat-00000-0000-0001', 'gj-stage-0000-0000-0001', 1, 'Selamat Datang di Audy', 'Kenali Audy Dental Clinic, visi misi, dan budaya kerja kami.', 15, true, true),
    ('gj-mat-00000-0000-0002', 'gj-stage-0000-0000-0001', 2, 'Panduan Pertama',        'Panduan onboarding: tools, akses, dan SOP dasar.',              10, true, true)
ON CONFLICT (id) DO NOTHING;

-- Sample material content block
INSERT INTO gj_material_content (material_id, sort_order, content_type, body) VALUES
    ('gj-mat-00000-0000-0001', 1, 'RICH_TEXT',
     '<h2>Selamat Datang! 👋</h2><p>Audy Dental Clinic adalah klinik gigi modern yang melayani dengan standar internasional. Di sini kamu akan menemukan lingkungan belajar yang mendukung perkembanganmu.</p>'),
    ('gj-mat-00000-0000-0001', 2, 'RICH_TEXT',
     '<h3>Visi Kami</h3><p>Menjadi klinik gigi terpercaya dengan layanan terbaik dan tim yang terus berkembang.</p>')
ON CONFLICT DO NOTHING;

-- ============================================================
-- REWARDS — Seed Data
-- ============================================================

-- ── Point Rules ──────────────────────────────────────────────
INSERT INTO point_rules (event_type, base_points, description) VALUES
    ('MATERIAL_COMPLETE', 10,  'Menyelesaikan materi pembelajaran'),
    ('CASE_COMPLETE',     15,  'Menyelesaikan studi kasus'),
    ('QUIZ_PASS',         25,  'Lulus kuis'),
    ('QUIZ_PERFECT',      50,  'Skor sempurna (100%) dalam kuis'),
    ('QUESTION_CORRECT',   2,  'Menjawab pertanyaan kuis dengan benar'),
    ('VERIFIED_ANSWER',   20,  'Jawaban Tanya Jawab diverifikasi'),
    ('GAME_COMPLETE',     30,  'Menyelesaikan permainan'),
    ('STREAK_BONUS',      15,  'Bonus streak belajar'),
    ('MANUAL_AWARD',       0,  'Poin manual dari admin'),
    ('MANUAL_DEDUCT',      0,  'Pengurangan poin manual dari admin')
ON CONFLICT (event_type) DO NOTHING;

-- ── Levels ───────────────────────────────────────────────────
INSERT INTO levels (level_number, label, points_required, icon, description) VALUES
    (1,  'Pemula',       0,    '🌱', 'Baru bergabung dan mulai belajar'),
    (2,  'Pelajar',      100,  '📖', 'Aktif mengikuti materi pembelajaran'),
    (3,  'Terampil',     300,  '⚡', 'Menunjukkan kemampuan yang berkembang'),
    (4,  'Mahir',        600,  '🎯', 'Menguasai sebagian besar materi'),
    (5,  'Ahli',         1000, '🏆', 'Telah menyelesaikan perjalanan pembelajaran'),
    (6,  'Master',       1500, '👑', 'Penguasaan penuh atas semua modul')
ON CONFLICT (level_number) DO NOTHING;

-- ── Badges ───────────────────────────────────────────────────
INSERT INTO badges (slug, title, description, icon, criteria_type, criteria_value) VALUES
    ('first-step',      'Langkah Pertama',    'Menyelesaikan materi pertama',          '🐣', 'MANUAL',           NULL),
    ('fast-learner',    'Pelajar Cepat',       'Menyelesaikan 5 materi dalam seminggu', '⚡', 'MANUAL',           NULL),
    ('quiz-champion',   'Juara Kuis',          'Lulus semua kuis dalam satu stage',     '🏆', 'STAGE_COMPLETE',   NULL),
    ('perfect-score',   'Nilai Sempurna',      'Mendapat skor 100% dalam kuis apapun',  '💯', 'PERFECT_QUIZ',     NULL),
    ('point-100',       'Poin 100',            'Mengumpulkan 100 poin',                 '💰', 'POINTS_THRESHOLD', '{"points": 100}'),
    ('point-500',       'Poin 500',            'Mengumpulkan 500 poin',                 '💎', 'POINTS_THRESHOLD', '{"points": 500}'),
    ('point-1000',      'Poin 1000',           'Mengumpulkan 1000 poin',                '👑', 'POINTS_THRESHOLD', '{"points": 1000}'),
    ('graduate',        'Wisudawan',           'Menyelesaikan semua stage Growth Journey', '🎓', 'ALL_STAGES_COMPLETE', NULL)
ON CONFLICT (slug) DO NOTHING;

-- ── Certificate Template ──────────────────────────────────────
-- HTML template will be updated by admin with actual content.
INSERT INTO certificate_templates (name, description, html_template, is_active) VALUES
    ('Growth Journey Stage',
     'Sertifikat penyelesaian stage Growth Journey',
     '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Sertifikat</title><style>body{font-family:''Inter'',sans-serif;margin:0;padding:0;background:#fff;} .cert{width:842px;height:595px;padding:60px;box-sizing:border-box;border:8px solid #1C50A7;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;} h1{color:#1C50A7;font-size:36px;margin:0 0 8px;} h2{color:#163d82;font-size:22px;margin:0 0 24px;} .name{font-size:28px;font-weight:700;color:#1a1f2e;margin:16px 0;} .body{font-size:15px;color:#4b5563;line-height:1.6;max-width:600px;} .date{font-size:13px;color:#6b7280;margin-top:24px;} .code{font-size:11px;color:#9ca3af;margin-top:8px;font-family:monospace;}</style></head><body><div class="cert"><h1>Audy Learning Centre</h1><h2>Sertifikat Penyelesaian</h2><p class="body">Dengan bangga diberikan kepada</p><div class="name">{{employee_name}}</div><p class="body">Atas keberhasilan menyelesaikan<br><strong>{{entity_label}}</strong></p><div class="date">Diterbitkan pada {{issued_date}}</div><div class="code">Kode Verifikasi: {{verification_code}}</div></div></body></html>',
     true)
ON CONFLICT (name) DO NOTHING;
