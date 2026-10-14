// ============================================================
// database.types.ts — ALC Full Database Type Definitions
// Regenerate with: npm run db:types
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ── Enum type aliases ───────────────────────────────────────

export type DriveEntityType = 'MATERIAL' | 'CASE' | 'ASSESSMENT' | 'PRODUCT_KNOWLEDGE' | 'FRESH_UPDATE' | 'PRACTICE' | 'GAME' | 'QNA' | 'PROFILE' | 'CERTIFICATE' | 'SYSTEM';
export type AttachmentType = 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'PDF' | 'SPREADSHEET' | 'PRESENTATION' | 'OTHER';
export type GjContentType = 'RICH_TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'GOOGLE_DOCS' | 'EXTERNAL_LINK';
export type GjProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type PointEventType = 'MATERIAL_COMPLETE' | 'CASE_COMPLETE' | 'QUIZ_PASS' | 'QUIZ_PERFECT' | 'QUESTION_CORRECT' | 'VERIFIED_ANSWER' | 'GAME_COMPLETE' | 'STREAK_BONUS' | 'MANUAL_AWARD' | 'MANUAL_DEDUCT';
export type BadgeCriteriaType = 'POINTS_THRESHOLD' | 'STAGE_COMPLETE' | 'ALL_STAGES_COMPLETE' | 'QUIZ_STREAK' | 'PERFECT_QUIZ' | 'MANUAL';
export type PlGameType = 'FLASHCARD' | 'MATCH_PAIRS' | 'FILL_BLANK' | 'MULTIPLE_CHOICE' | 'ORDERING' | 'DRAG_DROP';
export type LpResourceType = 'GOOGLE_DOCS' | 'GOOGLE_SHEETS' | 'GOOGLE_SLIDES' | 'DRIVE_FILE' | 'EXTERNAL_URL' | 'EMBEDDED_FORM';
export type AspStatus = 'SUBMITTED' | 'REVIEWED' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';
export type AspCategory = 'SARAN' | 'KELUHAN' | 'IDE' | 'APRESIASI' | 'LAINNYA';
export type NotificationType = 'POINTS_EARNED' | 'BADGE_EARNED' | 'CERTIFICATE_ISSUED' | 'QNA_ANSWER' | 'QNA_VERIFIED' | 'FRESH_UPDATE' | 'ASPIRATION_RESPONSE' | 'SYSTEM';
export type BackupStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'RESTORED';

// ── Database ────────────────────────────────────────────────

export interface Database {
	public: {
		Tables: {

			// ── Core ──────────────────────────────────────────

			profiles: {
				Row: { id: string; employee_code: string | null; full_name: string; username: string | null; email: string; phone: string | null; department_id: string | null; position_id: string | null; role: 'ADMIN' | 'STAFF'; avatar_url: string | null; is_active: boolean; last_login_at: string | null; created_at: string; updated_at: string };
				Insert: { id: string; employee_code?: string | null; full_name: string; username?: string | null; email: string; phone?: string | null; department_id?: string | null; position_id?: string | null; role?: 'ADMIN' | 'STAFF'; avatar_url?: string | null; is_active?: boolean; last_login_at?: string | null };
				Update: { employee_code?: string | null; full_name?: string; username?: string | null; email?: string; phone?: string | null; department_id?: string | null; position_id?: string | null; role?: 'ADMIN' | 'STAFF'; avatar_url?: string | null; is_active?: boolean; last_login_at?: string | null; updated_at?: string };
				Relationships: [];
			};
			departments: {
				Row: { id: string; name: string; description: string | null; is_active: boolean; created_at: string; updated_at: string };
				Insert: { id?: string; name: string; description?: string | null; is_active?: boolean };
				Update: { name?: string; description?: string | null; is_active?: boolean; updated_at?: string };
				Relationships: [];
			};
			positions: {
				Row: { id: string; name: 'RESEPSIONIS' | 'PERAWAT_GIGI' | 'SUPERVISOR'; label: string; description: string | null; is_active: boolean; created_at: string };
				Insert: { id?: string; name: 'RESEPSIONIS' | 'PERAWAT_GIGI' | 'SUPERVISOR'; label: string; description?: string | null; is_active?: boolean };
				Update: { label?: string; description?: string | null; is_active?: boolean };
				Relationships: [];
			};
			system_settings: {
				Row: { id: string; key: string; value: string; description: string | null; is_public: boolean; updated_by: string | null; updated_at: string };
				Insert: { id?: string; key: string; value: string; description?: string | null; is_public?: boolean; updated_by?: string | null };
				Update: { key?: string; value?: string; description?: string | null; is_public?: boolean; updated_by?: string | null; updated_at?: string };
				Relationships: [];
			};
			audit_logs: {
				Row: { id: string; user_id: string | null; action: string; table_name: string | null; record_id: string | null; old_data: Json | null; new_data: Json | null; ip_address: string | null; user_agent: string | null; created_at: string };
				Insert: { id?: string; user_id?: string | null; action: string; table_name?: string | null; record_id?: string | null; old_data?: Json | null; new_data?: Json | null; ip_address?: string | null; user_agent?: string | null };
				Update: { action?: string; table_name?: string | null };
				Relationships: [];
			};

			// ── Drive ─────────────────────────────────────────

			drive_files: {
				Row: { id: string; drive_file_id: string; drive_folder_id: string | null; name: string; mime_type: string; size_bytes: number | null; web_view_url: string | null; web_content_url: string | null; thumbnail_url: string | null; storage_area: string; entity_type: DriveEntityType; entity_id: string | null; uploaded_by: string | null; deleted_at: string | null; created_at: string; updated_at: string };
				Insert: { id?: string; drive_file_id: string; drive_folder_id?: string | null; name: string; mime_type: string; size_bytes?: number | null; web_view_url?: string | null; web_content_url?: string | null; thumbnail_url?: string | null; storage_area: string; entity_type: DriveEntityType; entity_id?: string | null; uploaded_by?: string | null; deleted_at?: string | null };
				Update: { drive_folder_id?: string | null; name?: string; mime_type?: string; size_bytes?: number | null; web_view_url?: string | null; web_content_url?: string | null; thumbnail_url?: string | null; storage_area?: string; entity_type?: DriveEntityType; entity_id?: string | null; deleted_at?: string | null; updated_at?: string };
				Relationships: [];
			};
			material_attachments: {
				Row: { id: string; material_id: string; drive_file_id: string; attachment_type: AttachmentType; display_name: string | null; sequence: number; created_at: string };
				Insert: { id?: string; material_id: string; drive_file_id: string; attachment_type: AttachmentType; display_name?: string | null; sequence?: number };
				Update: { attachment_type?: AttachmentType; display_name?: string | null; sequence?: number };
				Relationships: [];
			};

			// ── Growth Journey ────────────────────────────────

			gj_stages: {
				Row: { id: string; sort_order: number; title: string; description: string | null; icon: string | null; estimated_min: number | null; points_reward: number; position_filter: string[] | null; is_published: boolean; created_by: string | null; created_at: string; updated_at: string };
				Insert: { id?: string; sort_order?: number; title: string; description?: string | null; icon?: string | null; estimated_min?: number | null; points_reward?: number; position_filter?: string[] | null; is_published?: boolean; created_by?: string | null };
				Update: { sort_order?: number; title?: string; description?: string | null; icon?: string | null; estimated_min?: number | null; points_reward?: number; position_filter?: string[] | null; is_published?: boolean; updated_at?: string };
				Relationships: [];
			};
			gj_materials: {
				Row: { id: string; stage_id: string; sort_order: number; title: string; summary: string | null; estimated_min: number | null; is_required: boolean; is_published: boolean; created_by: string | null; created_at: string; updated_at: string };
				Insert: { id?: string; stage_id: string; sort_order?: number; title: string; summary?: string | null; estimated_min?: number | null; is_required?: boolean; is_published?: boolean; created_by?: string | null };
				Update: { sort_order?: number; title?: string; summary?: string | null; estimated_min?: number | null; is_required?: boolean; is_published?: boolean; updated_at?: string };
				Relationships: [];
			};
			gj_material_content: {
				Row: { id: string; material_id: string; sort_order: number; content_type: GjContentType; body: string | null; drive_file_id: string | null; caption: string | null; created_at: string; updated_at: string };
				Insert: { id?: string; material_id: string; sort_order?: number; content_type: GjContentType; body?: string | null; drive_file_id?: string | null; caption?: string | null };
				Update: { sort_order?: number; content_type?: GjContentType; body?: string | null; drive_file_id?: string | null; caption?: string | null; updated_at?: string };
				Relationships: [];
			};
			gj_cases: {
				Row: { id: string; stage_id: string; sort_order: number; title: string; description: string | null; body: string | null; is_published: boolean; created_by: string | null; created_at: string; updated_at: string };
				Insert: { id?: string; stage_id: string; sort_order?: number; title: string; description?: string | null; body?: string | null; is_published?: boolean; created_by?: string | null };
				Update: { sort_order?: number; title?: string; description?: string | null; body?: string | null; is_published?: boolean; updated_at?: string };
				Relationships: [];
			};
			gj_quizzes: {
				Row: { id: string; stage_id: string; sort_order: number; title: string; description: string | null; passing_score: number; max_attempts: number | null; time_limit_min: number | null; is_published: boolean; created_by: string | null; created_at: string; updated_at: string };
				Insert: { id?: string; stage_id: string; sort_order?: number; title: string; description?: string | null; passing_score?: number; max_attempts?: number | null; time_limit_min?: number | null; is_published?: boolean; created_by?: string | null };
				Update: { sort_order?: number; title?: string; description?: string | null; passing_score?: number; max_attempts?: number | null; time_limit_min?: number | null; is_published?: boolean; updated_at?: string };
				Relationships: [];
			};
			gj_quiz_questions: {
				Row: { id: string; quiz_id: string; sort_order: number; question_text: string; explanation: string | null; points: number; created_at: string };
				Insert: { id?: string; quiz_id: string; sort_order?: number; question_text: string; explanation?: string | null; points?: number };
				Update: { sort_order?: number; question_text?: string; explanation?: string | null; points?: number };
				Relationships: [];
			};
			gj_quiz_options: {
				Row: { id: string; question_id: string; sort_order: number; option_text: string; is_correct: boolean; created_at: string };
				Insert: { id?: string; question_id: string; sort_order?: number; option_text: string; is_correct?: boolean };
				Update: { sort_order?: number; option_text?: string; is_correct?: boolean };
				Relationships: [];
			};
			gj_attachments: {
				Row: { id: string; material_id: string; drive_file_id: string; attachment_type: AttachmentType; display_name: string | null; sequence: number; created_at: string };
				Insert: { id?: string; material_id: string; drive_file_id: string; attachment_type: AttachmentType; display_name?: string | null; sequence?: number };
				Update: { attachment_type?: AttachmentType; display_name?: string | null; sequence?: number };
				Relationships: [];
			};
			gj_user_progress: {
				Row: { id: string; user_id: string; stage_id: string; status: GjProgressStatus; completed_at: string | null; created_at: string; updated_at: string };
				Insert: { id?: string; user_id: string; stage_id: string; status?: GjProgressStatus; completed_at?: string | null };
				Update: { status?: GjProgressStatus; completed_at?: string | null; updated_at?: string };
				Relationships: [];
			};
			gj_material_progress: {
				Row: { id: string; user_id: string; material_id: string; status: GjProgressStatus; completed_at: string | null; created_at: string; updated_at: string };
				Insert: { id?: string; user_id: string; material_id: string; status?: GjProgressStatus; completed_at?: string | null };
				Update: { status?: GjProgressStatus; completed_at?: string | null; updated_at?: string };
				Relationships: [];
			};
			gj_quiz_attempts: {
				Row: { id: string; user_id: string; quiz_id: string; score: number | null; passed: boolean | null; started_at: string; completed_at: string | null; submitted_at: string | null; status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'; points_earned: number | null; created_at: string };
				Insert: { id?: string; user_id: string; quiz_id: string; score?: number | null; passed?: boolean | null; started_at?: string; completed_at?: string | null; submitted_at?: string | null; status?: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'; points_earned?: number | null };
				Update: { score?: number | null; passed?: boolean | null; completed_at?: string | null; submitted_at?: string | null; status?: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'; points_earned?: number | null };
				Relationships: [];
			};
			gj_quiz_answers: {
				Row: { id: string; attempt_id: string; question_id: string; option_id: string | null; is_correct: boolean | null; created_at: string };
				Insert: { id?: string; attempt_id: string; question_id: string; option_id?: string | null; is_correct?: boolean | null };
				Update: { option_id?: string | null; is_correct?: boolean | null };
				Relationships: [];
			};
			gj_case_attachments: {
				Row: { id: string; case_id: string; drive_file_id: string; attachment_type: AttachmentType; display_name: string | null; sequence: number; created_at: string };
				Insert: { id?: string; case_id: string; drive_file_id: string; attachment_type: AttachmentType; display_name?: string | null; sequence?: number };
				Update: { attachment_type?: AttachmentType; display_name?: string | null; sequence?: number };
				Relationships: [];
			};
			gj_question_attachments: {
				Row: { id: string; question_id: string; drive_file_id: string; attachment_type: AttachmentType; display_name: string | null; created_at: string };
				Insert: { id?: string; question_id: string; drive_file_id: string; attachment_type: AttachmentType; display_name?: string | null };
				Update: { attachment_type?: AttachmentType; display_name?: string | null };
				Relationships: [];
			};
			gj_case_progress: {
				Row: { id: string; user_id: string; case_id: string; status: GjProgressStatus; version_number: number; completed_at: string };
				Insert: { id?: string; user_id: string; case_id: string; status?: GjProgressStatus; version_number?: number; completed_at?: string };
				Update: { status?: GjProgressStatus; version_number?: number; completed_at?: string };
				Relationships: [];
			};

			// ── Rewards ───────────────────────────────────────

			point_rules: {
				Row: { id: string; event_type: PointEventType; base_points: number; description: string | null; is_active: boolean; created_at: string; updated_at: string };
				Insert: { id?: string; event_type: PointEventType; base_points?: number; description?: string | null; is_active?: boolean };
				Update: { base_points?: number; description?: string | null; is_active?: boolean; updated_at?: string };
				Relationships: [];
			};
			point_transactions: {
				Row: { id: string; user_id: string; event_type: PointEventType; points: number; entity_type: string | null; entity_id: string | null; idempotency_key: string; notes: string | null; created_at: string };
				Insert: { id?: string; user_id: string; event_type: PointEventType; points: number; entity_type?: string | null; entity_id?: string | null; idempotency_key: string; notes?: string | null };
				Update: never;
				Relationships: [];
			};
			levels: {
				Row: { id: string; level_number: number; label: string; points_required: number; icon: string | null; description: string | null; created_at: string };
				Insert: { id?: string; level_number: number; label: string; points_required: number; icon?: string | null; description?: string | null };
				Update: { level_number?: number; label?: string; points_required?: number; icon?: string | null; description?: string | null };
				Relationships: [];
			};
			badges: {
				Row: { id: string; slug: string; title: string; description: string | null; icon: string | null; image_drive_file_id: string | null; criteria_type: BadgeCriteriaType; criteria_value: Json | null; is_active: boolean; created_at: string; updated_at: string };
				Insert: { id?: string; slug: string; title: string; description?: string | null; icon?: string | null; image_drive_file_id?: string | null; criteria_type: BadgeCriteriaType; criteria_value?: Json | null; is_active?: boolean };
				Update: { title?: string; description?: string | null; icon?: string | null; image_drive_file_id?: string | null; criteria_type?: BadgeCriteriaType; criteria_value?: Json | null; is_active?: boolean; updated_at?: string };
				Relationships: [];
			};
			user_badges: {
				Row: { id: string; user_id: string; badge_id: string; awarded_at: string; awarded_by: string | null; notes: string | null };
				Insert: { id?: string; user_id: string; badge_id: string; awarded_at?: string; awarded_by?: string | null; notes?: string | null };
				Update: { notes?: string | null };
				Relationships: [];
			};
			certificate_templates: {
				Row: { id: string; name: string; description: string | null; background_drive_file_id: string | null; logo_drive_file_id: string | null; signature_drive_file_id: string | null; html_template: string; is_active: boolean; created_at: string; updated_at: string };
				Insert: { id?: string; name: string; description?: string | null; background_drive_file_id?: string | null; logo_drive_file_id?: string | null; signature_drive_file_id?: string | null; html_template?: string; is_active?: boolean };
				Update: { name?: string; description?: string | null; background_drive_file_id?: string | null; logo_drive_file_id?: string | null; signature_drive_file_id?: string | null; html_template?: string; is_active?: boolean; updated_at?: string };
				Relationships: [];
			};
			certificates: {
				Row: { id: string; user_id: string; entity_type: string; entity_id: string | null; entity_label: string; template_id: string | null; drive_file_id: string | null; verification_code: string; issued_at: string };
				Insert: { id?: string; user_id: string; entity_type: string; entity_id?: string | null; entity_label: string; template_id?: string | null; drive_file_id?: string | null; verification_code?: string; issued_at?: string };
				Update: { drive_file_id?: string | null; template_id?: string | null };
				Relationships: [];
			};

			// ── Product Knowledge ─────────────────────────────

			pk_categories: {
				Row: { id: string; sort_order: number; title: string; description: string | null; icon: string | null; position_filter: string[] | null; is_published: boolean; created_by: string | null; created_at: string; updated_at: string };
				Insert: { id?: string; sort_order?: number; title: string; description?: string | null; icon?: string | null; position_filter?: string[] | null; is_published?: boolean; created_by?: string | null };
				Update: { sort_order?: number; title?: string; description?: string | null; icon?: string | null; position_filter?: string[] | null; is_published?: boolean; updated_at?: string };
				Relationships: [];
			};
			pk_topics: {
				Row: { id: string; category_id: string; sort_order: number; title: string; summary: string | null; estimated_min: number | null; is_published: boolean; created_by: string | null; created_at: string; updated_at: string };
				Insert: { id?: string; category_id: string; sort_order?: number; title: string; summary?: string | null; estimated_min?: number | null; is_published?: boolean; created_by?: string | null };
				Update: { sort_order?: number; title?: string; summary?: string | null; estimated_min?: number | null; is_published?: boolean; updated_at?: string };
				Relationships: [];
			};
			pk_sections: {
				Row: { id: string; topic_id: string; sort_order: number; title: string | null; content_type: GjContentType; body: string | null; drive_file_id: string | null; caption: string | null; created_at: string; updated_at: string };
				Insert: { id?: string; topic_id: string; sort_order?: number; title?: string | null; content_type: GjContentType; body?: string | null; drive_file_id?: string | null; caption?: string | null };
				Update: { sort_order?: number; title?: string | null; content_type?: GjContentType; body?: string | null; drive_file_id?: string | null; caption?: string | null; updated_at?: string };
				Relationships: [];
			};
			pk_progress: {
				Row: { id: string; user_id: string; topic_id: string; status: GjProgressStatus; completed_at: string };
				Insert: { id?: string; user_id: string; topic_id: string; status?: GjProgressStatus; completed_at?: string };
				Update: { status?: GjProgressStatus; completed_at?: string };
				Relationships: [];
			};

			// ── Play & Learn ──────────────────────────────────

			pl_games: {
				Row: { id: string; title: string; description: string | null; game_type: PlGameType; passing_score: number; time_limit_min: number | null; points_reward: number; position_filter: string[] | null; is_published: boolean; created_by: string | null; created_at: string; updated_at: string };
				Insert: { id?: string; title: string; description?: string | null; game_type?: PlGameType; passing_score?: number; time_limit_min?: number | null; points_reward?: number; position_filter?: string[] | null; is_published?: boolean; created_by?: string | null };
				Update: { title?: string; description?: string | null; game_type?: PlGameType; passing_score?: number; time_limit_min?: number | null; points_reward?: number; position_filter?: string[] | null; is_published?: boolean; updated_at?: string };
				Relationships: [];
			};
			pl_game_items: {
				Row: { id: string; game_id: string; sort_order: number; prompt: string; answer: string; options: Json | null; drive_file_id: string | null; explanation: string | null; points: number; created_at: string };
				Insert: { id?: string; game_id: string; sort_order?: number; prompt: string; answer: string; options?: Json | null; drive_file_id?: string | null; explanation?: string | null; points?: number };
				Update: { sort_order?: number; prompt?: string; answer?: string; options?: Json | null; drive_file_id?: string | null; explanation?: string | null; points?: number };
				Relationships: [];
			};
			pl_attempts: {
				Row: { id: string; user_id: string; game_id: string; score: number | null; passed: boolean | null; points_earned: number | null; submitted_at: string | null; status: string; started_at: string; created_at: string };
				Insert: { id?: string; user_id: string; game_id: string; score?: number | null; passed?: boolean | null; points_earned?: number | null; submitted_at?: string | null; status?: string };
				Update: { score?: number | null; passed?: boolean | null; points_earned?: number | null; submitted_at?: string | null; status?: string };
				Relationships: [];
			};

			// ── Lets Practice ─────────────────────────────────

			lp_practices: {
				Row: { id: string; sort_order: number; title: string; description: string | null; resource_type: LpResourceType; resource_url: string | null; drive_file_id: string | null; estimated_min: number | null; position_filter: string[] | null; is_published: boolean; created_by: string | null; created_at: string; updated_at: string };
				Insert: { id?: string; sort_order?: number; title: string; description?: string | null; resource_type: LpResourceType; resource_url?: string | null; drive_file_id?: string | null; estimated_min?: number | null; position_filter?: string[] | null; is_published?: boolean; created_by?: string | null };
				Update: { sort_order?: number; title?: string; description?: string | null; resource_type?: LpResourceType; resource_url?: string | null; drive_file_id?: string | null; estimated_min?: number | null; position_filter?: string[] | null; is_published?: boolean; updated_at?: string };
				Relationships: [];
			};
			lp_completions: {
				Row: { id: string; user_id: string; practice_id: string; completed_at: string };
				Insert: { id?: string; user_id: string; practice_id: string; completed_at?: string };
				Update: never;
				Relationships: [];
			};

			// ── Tanya Jawab ───────────────────────────────────

			qna_questions: {
				Row: { id: string; author_id: string; title: string; body: string | null; is_published: boolean; is_resolved: boolean; view_count: number; created_at: string; updated_at: string };
				Insert: { id?: string; author_id: string; title: string; body?: string | null; is_published?: boolean };
				Update: { title?: string; body?: string | null; is_published?: boolean; is_resolved?: boolean; view_count?: number; updated_at?: string };
				Relationships: [];
			};
			qna_attachments: {
				Row: { id: string; question_id: string; drive_file_id: string; attachment_type: AttachmentType; display_name: string | null; sequence: number; created_at: string };
				Insert: { id?: string; question_id: string; drive_file_id: string; attachment_type: AttachmentType; display_name?: string | null; sequence?: number };
				Update: { display_name?: string | null; sequence?: number };
				Relationships: [];
			};
			qna_answers: {
				Row: { id: string; question_id: string; author_id: string; body: string; is_verified: boolean; verified_by: string | null; verified_at: string | null; is_accepted: boolean; created_at: string; updated_at: string };
				Insert: { id?: string; question_id: string; author_id: string; body: string; is_verified?: boolean };
				Update: { body?: string; is_verified?: boolean; verified_by?: string | null; verified_at?: string | null; is_accepted?: boolean; updated_at?: string };
				Relationships: [];
			};
			qna_votes: {
				Row: { id: string; user_id: string; answer_id: string; vote_type: string; created_at: string };
				Insert: { id?: string; user_id: string; answer_id: string; vote_type?: string };
				Update: { vote_type?: string };
				Relationships: [];
			};

			// ── Ruang Aspirasi ────────────────────────────────

			asp_submissions: {
				Row: { id: string; author_id: string | null; is_anonymous: boolean; category: AspCategory; title: string; body: string; status: AspStatus; admin_response: string | null; responded_by: string | null; responded_at: string | null; drive_file_id: string | null; created_at: string; updated_at: string };
				Insert: { id?: string; author_id?: string | null; is_anonymous?: boolean; category?: AspCategory; title: string; body: string; status?: AspStatus; drive_file_id?: string | null };
				Update: { status?: AspStatus; admin_response?: string | null; responded_by?: string | null; responded_at?: string | null; updated_at?: string };
				Relationships: [];
			};

			// ── Fresh Update ──────────────────────────────────

			fu_posts: {
				Row: { id: string; title: string; summary: string | null; body: string | null; cover_drive_file_id: string | null; is_published: boolean; published_at: string | null; position_filter: string[] | null; created_by: string | null; created_at: string; updated_at: string };
				Insert: { id?: string; title: string; summary?: string | null; body?: string | null; cover_drive_file_id?: string | null; is_published?: boolean; published_at?: string | null; position_filter?: string[] | null; created_by?: string | null };
				Update: { title?: string; summary?: string | null; body?: string | null; cover_drive_file_id?: string | null; is_published?: boolean; published_at?: string | null; position_filter?: string[] | null; updated_at?: string };
				Relationships: [];
			};
			fu_attachments: {
				Row: { id: string; post_id: string; drive_file_id: string; attachment_type: AttachmentType; display_name: string | null; sequence: number; created_at: string };
				Insert: { id?: string; post_id: string; drive_file_id: string; attachment_type: AttachmentType; display_name?: string | null; sequence?: number };
				Update: { display_name?: string | null; sequence?: number };
				Relationships: [];
			};
			fu_reads: {
				Row: { id: string; user_id: string; post_id: string; read_at: string };
				Insert: { id?: string; user_id: string; post_id: string; read_at?: string };
				Update: { read_at?: string };
				Relationships: [];
			};

			// ── Notifications ─────────────────────────────────

			notifications: {
				Row: { id: string; user_id: string; type: NotificationType; title: string; body: string | null; action_url: string | null; is_read: boolean; created_at: string };
				Insert: { id?: string; user_id: string; type: NotificationType; title: string; body?: string | null; action_url?: string | null; is_read?: boolean };
				Update: { is_read?: boolean };
				Relationships: [];
			};

			// ── Backup ────────────────────────────────────────

			backup_jobs: {
				Row: { id: string; status: BackupStatus; initiated_by: string | null; backup_type: string; drive_file_id: string | null; local_size_bytes: number | null; started_at: string | null; completed_at: string | null; record_counts: Json | null; drive_file_ids_count: number | null; missing_files: Json | null; error_message: string | null; created_at: string };
				Insert: { id?: string; status?: BackupStatus; initiated_by?: string | null; backup_type?: string; drive_file_id?: string | null; local_size_bytes?: number | null; started_at?: string | null; completed_at?: string | null; record_counts?: Json | null; drive_file_ids_count?: number | null; missing_files?: Json | null; error_message?: string | null };
				Update: { status?: BackupStatus; drive_file_id?: string | null; local_size_bytes?: number | null; started_at?: string | null; completed_at?: string | null; record_counts?: Json | null; drive_file_ids_count?: number | null; missing_files?: Json | null; error_message?: string | null };
				Relationships: [];
			};

		};

		Views: Record<string, never>;
		Functions: Record<string, never>;

		Enums: {
			user_role: 'ADMIN' | 'STAFF';
			user_position: 'RESEPSIONIS' | 'PERAWAT_GIGI' | 'SUPERVISOR';
			drive_entity_type: DriveEntityType;
			attachment_type: AttachmentType;
			gj_content_type: GjContentType;
			gj_progress_status: GjProgressStatus;
			point_event_type: PointEventType;
			badge_criteria_type: BadgeCriteriaType;
			pl_game_type: PlGameType;
			lp_resource_type: LpResourceType;
			asp_status: AspStatus;
			asp_category: AspCategory;
			notification_type: NotificationType;
			backup_status: BackupStatus;
		};

		CompositeTypes: Record<string, never>;
	};
}

// ── Convenience helpers ─────────────────────────────────────

export type Tables<T extends keyof Database['public']['Tables']> =
	Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
	Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
	Database['public']['Tables'][T]['Update'];

export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];
