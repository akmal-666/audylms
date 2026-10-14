// ============================================================
// Growth Journey — Application Types
// ============================================================

import type { Tables, GjProgressStatus } from './database.types';

export type Stage = Tables<'gj_stages'>;
export type Material = Tables<'gj_materials'>;
export type MaterialContent = Tables<'gj_material_content'>;
export type GjCase = Tables<'gj_cases'>;
export type Quiz = Tables<'gj_quizzes'>;
export type QuizQuestion = Tables<'gj_quiz_questions'>;
export type QuizOption = Tables<'gj_quiz_options'>;
export type GjAttachment = Tables<'gj_attachments'>;
export type DriveFile = Tables<'drive_files'>;
export type UserProgress = Tables<'gj_user_progress'>;
export type MaterialProgress = Tables<'gj_material_progress'>;
export type QuizAttempt = Tables<'gj_quiz_attempts'>;
export type QuizAnswer = Tables<'gj_quiz_answers'>;

export type { GjProgressStatus };

// ── Resolved / joined types ──────────────────────────────────

/** Material content block with drive_file joined */
export interface MaterialContentWithFile extends MaterialContent {
	drive_file: DriveFile | null;
}

/** Material with all its content blocks and attachments */
export interface MaterialWithContent extends Material {
	content_blocks: MaterialContentWithFile[];
	attachments: Array<GjAttachment & { drive_file: DriveFile }>;
}

/** Stage with counts for tabs (server-side aggregation) */
export interface StageWithCounts extends Stage {
	material_count: number;
	case_count: number;
	quiz_count: number;
	attachment_count: number;
	user_progress: UserProgress | null;
	completed_material_count: number;
}

/** Full stage detail for the employee stage page */
export interface StageDetail extends Stage {
	stage_number: number; // derived from sort_order rank
	materials: MaterialWithContent[];
	cases: GjCase[];
	quizzes: Quiz[];
	user_progress: UserProgress | null;
	material_progresses: MaterialProgress[];
	quiz_attempts: QuizAttempt[];
}

/** Quiz with questions and options (for quiz view) */
export interface QuizWithQuestions extends Quiz {
	questions: Array<
		QuizQuestion & {
			options: QuizOption[];
		}
	>;
}

/** Summary of a user's progress through Growth Journey */
export interface GrowthJourneyProgress {
	total_stages: number;
	completed_stages: number;
	in_progress_stages: number;
	total_points_earned: number;
	stages: StageWithCounts[];
}

/** Payload for submitting a quiz attempt */
export interface QuizSubmission {
	quiz_id: string;
	answers: Array<{
		question_id: string;
		option_id: string;
	}>;
}

/** Result of a quiz submission */
export interface QuizResult {
	attempt: QuizAttempt;
	score: number;
	passed: boolean;
	total_questions: number;
	correct_answers: number;
	per_question: Array<{
		question_id: string;
		question_text: string;
		selected_option_id: string | null;
		correct_option_id: string | null;
		is_correct: boolean;
		explanation: string | null;
	}>;
}

// ── Phase 4: Assessment engine additions ─────────────────────

export type CaseAttachment = Tables<'gj_case_attachments'>;
export type QuestionAttachment = Tables<'gj_question_attachments'>;
export type CaseProgress = Tables<'gj_case_progress'>;

export type QuizAttemptStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';

/** Quiz expiry status returned to employee */
export interface QuizExpiryStatus {
	is_expired: boolean;
	last_passed_at: string | null;
	expires_at: string | null; // computed from last_passed_at + refresh_days
	refresh_days: number | null;
}

/**
 * Quiz question sent to the employee.
 * SECURITY: is_correct is STRIPPED from options before sending to browser.
 */
export interface QuizQuestionForEmployee {
	id: string;
	sort_order: number;
	question_text: string;
	points: number;
	options: Array<{
		id: string;
		sort_order: number;
		option_text: string;
		// is_correct intentionally omitted
	}>;
	attachment: (QuestionAttachment & { drive_file: DriveFile }) | null;
}

/**
 * Quiz data sent to employee — never includes correct answers.
 */
export interface QuizForEmployee extends Omit<Quiz, never> {
	questions: QuizQuestionForEmployee[];
	expiry_status: QuizExpiryStatus;
	attempt_count: number;
	best_score: number | null;
	can_attempt: boolean;
	active_attempt: QuizAttempt | null;
}

/**
 * Case with its Drive attachments.
 */
export interface CaseWithAttachments extends GjCase {
	attachments: Array<CaseAttachment & { drive_file: DriveFile }>;
	user_progress: CaseProgress | null;
	version_number: number;
	requires_retake: boolean;
}

/** Extended QuizResult with points breakdown */
export interface QuizResultV2 {
	attempt: QuizAttempt;
	score: number; // percentage 0-100
	points_earned: number;
	points_possible: number;
	passed: boolean;
	total_questions: number;
	correct_answers: number;
	is_expired_retake?: boolean;
	per_question: Array<{
		question_id: string;
		question_text: string;
		selected_option_id: string | null;
		correct_option_id: string | null;
		is_correct: boolean;
		explanation: string | null;
		points: number;
		attachment: (QuestionAttachment & { drive_file: DriveFile }) | null;
	}>;
}

/** Versioned entity — for cases and quizzes */
export interface VersionInfo {
	version_number: number;
	parent_id: string | null;
	requires_retake: boolean;
}
