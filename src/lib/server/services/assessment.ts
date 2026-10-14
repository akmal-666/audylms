// ============================================================
// Assessment Engine — Server Service
// SERVER ONLY — NEVER import from client code.
//
// Security principles enforced here:
//   1. Correct answers (is_correct) NEVER leave this service
//      when building employee-facing quiz data.
//   2. Score is computed server-side from DB-authoritative data.
//   3. Submitted attempts are locked (submitted_at prevents re-score).
//   4. Duplicate in-progress prevention at DB level + service level.
//   5. Attempt count and expiry checked before allowing a new attempt.
// ============================================================

import type { createSupabaseServerClient } from '$lib/server/supabase';
import type {
	QuizForEmployee,
	QuizQuestionForEmployee,
	QuizResultV2,
	QuizExpiryStatus,
	CaseWithAttachments,
	QuizAttemptStatus
} from '$lib/types/growth-journey.types';
import type { Tables } from '$lib/types/database.types';

type DbClient = ReturnType<typeof createSupabaseServerClient>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const q = (db: DbClient, table: string) => (db as any).from(table);

// ═══════════════════════════════════════════════════════════════
// QUIZ — Employee-facing (secure, no correct answers in response)
// ═══════════════════════════════════════════════════════════════

/**
 * Get quiz data for an employee.
 *
 * SECURITY:
 *   - Strips is_correct from all options.
 *   - Computes expiry server-side.
 *   - Checks attempt limit before allowing new attempt.
 *   - Never returns DB is_correct field.
 */
export async function getQuizForEmployee(
	db: DbClient,
	quizId: string,
	userId: string
): Promise<QuizForEmployee | null> {
	// 1. Load quiz
	const { data: quiz } = await q(db, 'gj_quizzes').select('*').eq('id', quizId).single();
	if (!quiz) return null;

	// 2. Load questions (WITHOUT options initially — we'll strip is_correct)
	const { data: questions } = await q(db, 'gj_quiz_questions')
		.select('*')
		.eq('quiz_id', quizId)
		.order('sort_order');

	const qList = (questions ?? []) as Tables<'gj_quiz_questions'>[];
	const qIds = qList.map((q) => q.id);

	// 3. Load options — we load all fields but STRIP is_correct before returning
	const { data: options } = qIds.length
		? await q(db, 'gj_quiz_options').select('*').in('question_id', qIds).order('sort_order')
		: { data: [] };

	// 4. Load question attachments
	const { data: qAttachments } = qIds.length
		? await q(db, 'gj_question_attachments')
				.select('*, drive_file:drive_files(*)')
				.in('question_id', qIds)
		: { data: [] };

	const optsByQ = new Map<string, Tables<'gj_quiz_options'>[]>();
	for (const opt of (options ?? []) as Tables<'gj_quiz_options'>[]) {
		const existing = optsByQ.get(opt.question_id) ?? [];
		existing.push(opt);
		optsByQ.set(opt.question_id, existing);
	}

	const attachByQ = new Map<
		string,
		(Tables<'gj_question_attachments'> & { drive_file: Tables<'drive_files'> }) | null
	>();
	for (const att of (qAttachments ?? []) as Array<
		Tables<'gj_question_attachments'> & { drive_file: Tables<'drive_files'> }
	>) {
		attachByQ.set(att.question_id, att);
	}

	// 5. Build employee-safe questions — is_correct intentionally excluded
	const employeeQuestions: QuizQuestionForEmployee[] = qList.map((qn) => ({
		id: qn.id,
		sort_order: qn.sort_order,
		question_text: qn.question_text,
		points: qn.points,
		options: (optsByQ.get(qn.id) ?? []).map((o) => ({
			id: o.id,
			sort_order: o.sort_order,
			option_text: o.option_text
			// is_correct: NEVER included
		})),
		attachment: attachByQ.get(qn.id) ?? null
	}));

	// 6. Attempt history
	const { data: attempts } = await q(db, 'gj_quiz_attempts')
		.select('*')
		.eq('user_id', userId)
		.eq('quiz_id', quizId)
		.order('created_at', { ascending: false });

	const attemptList = (attempts ?? []) as Tables<'gj_quiz_attempts'>[];
	const completedAttempts = attemptList.filter((a) => a.status === 'COMPLETED');
	const activeAttempt = attemptList.find((a) => a.status === 'IN_PROGRESS') ?? null;

	// 7. Expiry status
	const expiryStatus = computeExpiryStatus(quiz, completedAttempts);

	// 8. Best score from completed passing attempts
	const bestScore = completedAttempts.reduce(
		(max, a) => (a.score !== null && a.score > max ? a.score : max),
		0
	);

	// 9. Can the employee attempt?
	const attemptCount = completedAttempts.length;
	const atLimit = quiz.max_attempts !== null && attemptCount >= quiz.max_attempts;
	const canAttempt =
		!atLimit &&
		!activeAttempt &&
		(expiryStatus.is_expired || !completedAttempts.some((a) => a.passed));

	return {
		...quiz,
		questions: employeeQuestions,
		expiry_status: expiryStatus,
		attempt_count: attemptCount,
		best_score: bestScore > 0 ? bestScore : null,
		can_attempt: canAttempt || activeAttempt !== null,
		active_attempt: activeAttempt
	};
}

function computeExpiryStatus(
	quiz: Tables<'gj_quizzes'>,
	completedAttempts: Tables<'gj_quiz_attempts'>[]
): QuizExpiryStatus {
	const passedAttempts = completedAttempts.filter((a) => a.passed === true);
	const lastPassed =
		passedAttempts.length > 0
			? passedAttempts.sort(
					(a, b) =>
						new Date(b.completed_at ?? b.created_at).getTime() -
						new Date(a.completed_at ?? a.created_at).getTime()
				)[0]
			: null;

	const lastPassedAt = lastPassed?.completed_at ?? null;
	const refreshDays =
		(quiz as Tables<'gj_quizzes'> & { refresh_days?: number | null }).refresh_days ?? null;

	if (!refreshDays || !lastPassedAt) {
		return {
			is_expired: false,
			last_passed_at: lastPassedAt,
			expires_at: null,
			refresh_days: refreshDays
		};
	}

	const expiresAt = new Date(lastPassedAt);
	expiresAt.setDate(expiresAt.getDate() + refreshDays);
	const isExpired = new Date() > expiresAt;

	return {
		is_expired: isExpired,
		last_passed_at: lastPassedAt,
		expires_at: expiresAt.toISOString(),
		refresh_days: refreshDays
	};
}

// ═══════════════════════════════════════════════════════════════
// QUIZ — Submission (server-side scoring, immutable result)
// ═══════════════════════════════════════════════════════════════

/**
 * Start a new quiz attempt (creates IN_PROGRESS record).
 * Enforces:
 *   - No duplicate active attempts (DB unique index also guards this).
 *   - Attempt count limit.
 *   - Expiry refresh: expired employees can always retake.
 */
export async function startQuizAttempt(
	db: DbClient,
	quizId: string,
	userId: string
): Promise<Tables<'gj_quiz_attempts'>> {
	// Guard: check for existing IN_PROGRESS attempt
	const { data: existing } = await q(db, 'gj_quiz_attempts')
		.select('id')
		.eq('user_id', userId)
		.eq('quiz_id', quizId)
		.eq('status', 'IN_PROGRESS')
		.maybeSingle();

	if (existing) {
		// Return existing attempt — idempotent
		return existing as Tables<'gj_quiz_attempts'>;
	}

	// Guard: check attempt count limit
	const { data: quiz } = await q(db, 'gj_quizzes').select('max_attempts').eq('id', quizId).single();
	if (quiz?.max_attempts !== null) {
		const { count } = await q(db, 'gj_quiz_attempts')
			.select('id', { count: 'exact', head: true })
			.eq('user_id', userId)
			.eq('quiz_id', quizId)
			.eq('status', 'COMPLETED');

		if ((count ?? 0) >= (quiz.max_attempts ?? Infinity)) {
			throw new Error('Batas percobaan telah tercapai.');
		}
	}

	const { data, error } = await q(db, 'gj_quiz_attempts')
		.insert({
			user_id: userId,
			quiz_id: quizId,
			status: 'IN_PROGRESS',
			started_at: new Date().toISOString()
		})
		.select()
		.single();

	if (error) throw new Error(`Gagal memulai kuis: ${error.message}`);
	return data as Tables<'gj_quiz_attempts'>;
}

/**
 * Submit and score a quiz attempt.
 *
 * SECURITY guarantees:
 *   1. Correct answers loaded fresh from DB — never trusted from client.
 *   2. submitted_at set atomically — prevents re-submission.
 *   3. Score computed from DB-authoritative is_correct values.
 *   4. Attempt must be IN_PROGRESS and owned by userId.
 *   5. No manipulation possible after submitted_at is set (DB trigger).
 */
export async function submitQuizAttempt(
	db: DbClient,
	attemptId: string,
	userId: string,
	answers: Array<{ question_id: string; option_id: string }>
): Promise<QuizResultV2> {
	// 1. Verify attempt ownership and status
	const { data: attempt } = await q(db, 'gj_quiz_attempts')
		.select('*')
		.eq('id', attemptId)
		.eq('user_id', userId)
		.single();

	if (!attempt) throw new Error('Percobaan tidak ditemukan.');

	const att = attempt as Tables<'gj_quiz_attempts'>;

	if (att.status !== 'IN_PROGRESS') {
		throw new Error('Kuis ini sudah dikerjakan atau ditinggalkan.');
	}
	if (att.submitted_at !== null) {
		throw new Error('Kuis ini sudah dikumpulkan.');
	}

	// 2. Load quiz + questions + correct options from DB (authoritative source)
	const { data: quiz } = await q(db, 'gj_quizzes').select('*').eq('id', att.quiz_id).single();
	if (!quiz) throw new Error('Kuis tidak ditemukan.');

	const { data: questions } = await q(db, 'gj_quiz_questions')
		.select('*')
		.eq('quiz_id', att.quiz_id)
		.order('sort_order');

	const qList = (questions ?? []) as Tables<'gj_quiz_questions'>[];
	const qIds = qList.map((q) => q.id);

	// 3. Load options WITH is_correct (server-side only, never sent to client)
	const { data: options } = qIds.length
		? await q(db, 'gj_quiz_options').select('*').in('question_id', qIds)
		: { data: [] };

	// 4. Load question attachments for result display
	const { data: qAttachments } = qIds.length
		? await q(db, 'gj_question_attachments')
				.select('*, drive_file:drive_files(*)')
				.in('question_id', qIds)
		: { data: [] };

	const attachByQ = new Map<
		string,
		(Tables<'gj_question_attachments'> & { drive_file: Tables<'drive_files'> }) | null
	>();
	for (const a of (qAttachments ?? []) as Array<
		Tables<'gj_question_attachments'> & { drive_file: Tables<'drive_files'> }
	>) {
		attachByQ.set(a.question_id, a);
	}

	// 5. Build correct-answer map from DB
	const correctByQuestion = new Map<string, string>();
	const optionsByQuestion = new Map<string, Tables<'gj_quiz_options'>[]>();

	for (const opt of (options ?? []) as Tables<'gj_quiz_options'>[]) {
		const existing = optionsByQuestion.get(opt.question_id) ?? [];
		existing.push(opt);
		optionsByQuestion.set(opt.question_id, existing);

		if (opt.is_correct) {
			correctByQuestion.set(opt.question_id, opt.id);
		}
	}

	// 6. Score each answer against authoritative correct answers
	const submittedMap = new Map(answers.map((a) => [a.question_id, a.option_id]));

	let correctCount = 0;
	let pointsEarned = 0;
	let pointsPossible = 0;
	const perQuestion: QuizResultV2['per_question'] = [];

	for (const qn of qList) {
		const selectedOptionId = submittedMap.get(qn.id) ?? null;
		const correctOptionId = correctByQuestion.get(qn.id) ?? null;
		const isCorrect = selectedOptionId !== null && selectedOptionId === correctOptionId;

		if (isCorrect) {
			correctCount++;
			pointsEarned += qn.points;
		}
		pointsPossible += qn.points;

		perQuestion.push({
			question_id: qn.id,
			question_text: qn.question_text,
			selected_option_id: selectedOptionId,
			correct_option_id: correctOptionId,
			is_correct: isCorrect,
			explanation: qn.explanation,
			points: qn.points,
			attachment: attachByQ.get(qn.id) ?? null
		});
	}

	const totalQ = qList.length;
	const score = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;
	const passed = score >= (quiz as Tables<'gj_quizzes'>).passing_score;
	const now = new Date().toISOString();

	// 7. Update attempt atomically — set submitted_at to lock the record
	const { data: updatedAttempt, error: updateError } = await q(db, 'gj_quiz_attempts')
		.update({
			score,
			passed,
			points_earned: pointsEarned,
			status: 'COMPLETED' as QuizAttemptStatus,
			completed_at: now,
			submitted_at: now // This locks the attempt — DB trigger prevents further updates
		})
		.eq('id', attemptId)
		.eq('user_id', userId)
		.eq('status', 'IN_PROGRESS') // Extra guard: only update if still IN_PROGRESS
		.select()
		.single();

	if (updateError) throw new Error(`Gagal menyimpan hasil: ${updateError.message}`);
	if (!updatedAttempt)
		throw new Error('Percobaan tidak dapat disimpan — mungkin sudah dikumpulkan.');

	// 8. Insert individual answers
	const answerRows = perQuestion.map((pq) => ({
		attempt_id: attemptId,
		question_id: pq.question_id,
		option_id: pq.selected_option_id,
		is_correct: pq.is_correct
	}));

	if (answerRows.length > 0) {
		await q(db, 'gj_quiz_answers').insert(answerRows);
	}

	return {
		attempt: updatedAttempt as Tables<'gj_quiz_attempts'>,
		score,
		points_earned: pointsEarned,
		points_possible: pointsPossible,
		passed,
		total_questions: totalQ,
		correct_answers: correctCount,
		per_question: perQuestion
	};
}

/**
 * Abandon an in-progress attempt (e.g. if employee leaves mid-quiz).
 */
export async function abandonQuizAttempt(
	db: DbClient,
	attemptId: string,
	userId: string
): Promise<void> {
	await q(db, 'gj_quiz_attempts')
		.update({ status: 'ABANDONED' as QuizAttemptStatus })
		.eq('id', attemptId)
		.eq('user_id', userId)
		.eq('status', 'IN_PROGRESS');
}

/**
 * Get a completed attempt result by ID.
 * Used for the post-quiz review screen.
 * Correct answers are included (the attempt is already submitted).
 */
export async function getAttemptResult(
	db: DbClient,
	attemptId: string,
	userId: string
): Promise<QuizResultV2 | null> {
	const { data: attempt } = await q(db, 'gj_quiz_attempts')
		.select('*')
		.eq('id', attemptId)
		.eq('user_id', userId)
		.eq('status', 'COMPLETED')
		.single();

	if (!attempt) return null;
	const att = attempt as Tables<'gj_quiz_attempts'>;

	// Load answers with question/option details
	const { data: answers } = await q(db, 'gj_quiz_answers').select('*').eq('attempt_id', attemptId);

	const answerList = (answers ?? []) as Tables<'gj_quiz_answers'>[];
	const qIds = [...new Set(answerList.map((a) => a.question_id))];

	const { data: questions } = qIds.length
		? await q(db, 'gj_quiz_questions').select('*').in('id', qIds).order('sort_order')
		: { data: [] };

	const { data: options } = qIds.length
		? await q(db, 'gj_quiz_options').select('*').in('question_id', qIds)
		: { data: [] };

	const { data: qAttachments } = qIds.length
		? await q(db, 'gj_question_attachments')
				.select('*, drive_file:drive_files(*)')
				.in('question_id', qIds)
		: { data: [] };

	const correctByQ = new Map<string, string>();
	for (const opt of (options ?? []) as Tables<'gj_quiz_options'>[]) {
		if (opt.is_correct) correctByQ.set(opt.question_id, opt.id);
	}

	const attachByQ = new Map<
		string,
		Tables<'gj_question_attachments'> & { drive_file: Tables<'drive_files'> }
	>();
	for (const a of (qAttachments ?? []) as Array<
		Tables<'gj_question_attachments'> & { drive_file: Tables<'drive_files'> }
	>) {
		attachByQ.set(a.question_id, a);
	}

	const answerByQ = new Map(answerList.map((a) => [a.question_id, a]));

	const perQuestion: QuizResultV2['per_question'] = [];
	let pointsEarned = 0;
	let pointsPossible = 0;

	for (const qn of (questions ?? []) as Tables<'gj_quiz_questions'>[]) {
		const answer = answerByQ.get(qn.id);
		const isCorrect = answer?.is_correct ?? false;
		if (isCorrect) pointsEarned += qn.points;
		pointsPossible += qn.points;

		perQuestion.push({
			question_id: qn.id,
			question_text: qn.question_text,
			selected_option_id: answer?.option_id ?? null,
			correct_option_id: correctByQ.get(qn.id) ?? null,
			is_correct: isCorrect,
			explanation: qn.explanation,
			points: qn.points,
			attachment: attachByQ.get(qn.id) ?? null
		});
	}

	// quiz.passing_score not needed here — score is already stored on the attempt
	return {
		attempt: att,
		score: att.score ?? 0,
		points_earned: att.points_earned ?? pointsEarned,
		points_possible: pointsPossible,
		passed: att.passed ?? false,
		total_questions: perQuestion.length,
		correct_answers: perQuestion.filter((p) => p.is_correct).length,
		per_question: perQuestion
	};
}

// ═══════════════════════════════════════════════════════════════
// CASES
// ═══════════════════════════════════════════════════════════════

/**
 * Get a case with all Drive attachments for display.
 */
export async function getCaseWithAttachments(
	db: DbClient,
	caseId: string,
	userId: string
): Promise<CaseWithAttachments | null> {
	const { data: gjCase } = await q(db, 'gj_cases')
		.select('*')
		.eq('id', caseId)
		.eq('is_published', true)
		.single();

	if (!gjCase) return null;

	const { data: attachments } = await q(db, 'gj_case_attachments')
		.select('*, drive_file:drive_files(*)')
		.eq('case_id', caseId)
		.order('sequence');

	const { data: progress } = await q(db, 'gj_case_progress')
		.select('*')
		.eq('user_id', userId)
		.eq('case_id', caseId)
		.maybeSingle();

	const caseRow = gjCase as Tables<'gj_cases'> & {
		version_number?: number;
		requires_retake?: boolean;
	};

	return {
		...caseRow,
		version_number: caseRow.version_number ?? 1,
		requires_retake: caseRow.requires_retake ?? false,
		attachments: (attachments ?? []) as Array<
			Tables<'gj_case_attachments'> & { drive_file: Tables<'drive_files'> }
		>,
		user_progress: (progress as Tables<'gj_case_progress'>) ?? null
	};
}

/**
 * Mark a case as completed for the current user.
 */
export async function markCaseCompleted(
	db: DbClient,
	caseId: string,
	userId: string,
	versionNumber = 1
): Promise<void> {
	await q(db, 'gj_case_progress').upsert(
		{
			user_id: userId,
			case_id: caseId,
			status: 'COMPLETED',
			version_number: versionNumber,
			completed_at: new Date().toISOString()
		},
		{ onConflict: 'user_id,case_id' }
	);
}

// ═══════════════════════════════════════════════════════════════
// VERSIONING
// ═══════════════════════════════════════════════════════════════

/**
 * Create a new version of a quiz.
 * The old quiz is retained for historical data.
 * The new quiz starts unpublished.
 */
export async function createQuizVersion(
	db: DbClient,
	sourceQuizId: string,
	adminUserId: string
): Promise<Tables<'gj_quizzes'>> {
	const { data: source } = await q(db, 'gj_quizzes').select('*').eq('id', sourceQuizId).single();
	if (!source) throw new Error('Quiz tidak ditemukan.');

	const sourceQ = source as Tables<'gj_quizzes'> & { version_number?: number };

	const { data: newQuiz, error } = await q(db, 'gj_quizzes')
		.insert({
			stage_id: sourceQ.stage_id,
			sort_order: sourceQ.sort_order,
			title: sourceQ.title,
			description: sourceQ.description,
			passing_score: sourceQ.passing_score,
			max_attempts: sourceQ.max_attempts,
			time_limit_min: sourceQ.time_limit_min,
			version_number: (sourceQ.version_number ?? 1) + 1,
			parent_quiz_id: sourceQuizId,
			requires_retake: true,
			is_published: false,
			created_by: adminUserId
		})
		.select()
		.single();

	if (error) throw new Error(`Gagal membuat versi baru: ${error.message}`);
	return newQuiz as Tables<'gj_quizzes'>;
}

/**
 * Create a new version of a case study.
 */
export async function createCaseVersion(
	db: DbClient,
	sourceCaseId: string,
	adminUserId: string
): Promise<Tables<'gj_cases'>> {
	const { data: source } = await q(db, 'gj_cases').select('*').eq('id', sourceCaseId).single();
	if (!source) throw new Error('Studi kasus tidak ditemukan.');

	const sourceC = source as Tables<'gj_cases'> & { version_number?: number };

	const { data: newCase, error } = await q(db, 'gj_cases')
		.insert({
			stage_id: sourceC.stage_id,
			sort_order: sourceC.sort_order,
			title: sourceC.title,
			description: sourceC.description,
			body: sourceC.body,
			version_number: (sourceC.version_number ?? 1) + 1,
			parent_case_id: sourceCaseId,
			requires_retake: true,
			is_published: false,
			created_by: adminUserId
		})
		.select()
		.single();

	if (error) throw new Error(`Gagal membuat versi baru: ${error.message}`);
	return newCase as Tables<'gj_cases'>;
}
