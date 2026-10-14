// ============================================================
// Growth Journey — Server Service
// SERVER ONLY
// ============================================================

import type { createSupabaseServerClient } from '$lib/server/supabase';
import type {
	GrowthJourneyProgress,
	StageDetail,
	StageWithCounts,
	QuizWithQuestions,
	QuizResult,
	QuizSubmission,
	MaterialWithContent,
	MaterialContentWithFile
} from '$lib/types/growth-journey.types';
import type { Tables, TablesInsert, TablesUpdate } from '$lib/types/database.types';

type DbClient = ReturnType<typeof createSupabaseServerClient>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const q = (db: DbClient, table: string) => (db as any).from(table);

// ── Stage queries ────────────────────────────────────────────

/**
 * List all published stages visible to the user's position.
 * RLS handles position filtering — this just fetches them.
 */
export async function listStagesForUser(
	db: DbClient,
	userId: string
): Promise<GrowthJourneyProgress> {
	// Load stages
	const { data: stages } = await q(db, 'gj_stages')
		.select('*')
		.eq('is_published', true)
		.order('sort_order');

	const stageList = (stages ?? []) as Tables<'gj_stages'>[];

	if (stageList.length === 0) {
		return {
			total_stages: 0,
			completed_stages: 0,
			in_progress_stages: 0,
			total_points_earned: 0,
			stages: []
		};
	}

	const stageIds = stageList.map((s) => s.id);

	// Load user progress for all stages
	const { data: progressRows } = await q(db, 'gj_user_progress')
		.select('*')
		.eq('user_id', userId)
		.in('stage_id', stageIds);

	const progressMap = new Map(
		((progressRows ?? []) as Tables<'gj_user_progress'>[]).map((p) => [p.stage_id, p])
	);

	// Load material counts per stage
	const { data: matCounts } = await q(db, 'gj_materials')
		.select('stage_id')
		.eq('is_published', true)
		.in('stage_id', stageIds);

	const matCountMap = new Map<string, number>();
	for (const m of (matCounts ?? []) as { stage_id: string }[]) {
		matCountMap.set(m.stage_id, (matCountMap.get(m.stage_id) ?? 0) + 1);
	}

	// Load case counts
	const { data: caseCounts } = await q(db, 'gj_cases')
		.select('stage_id')
		.eq('is_published', true)
		.in('stage_id', stageIds);

	const caseCountMap = new Map<string, number>();
	for (const c of (caseCounts ?? []) as { stage_id: string }[]) {
		caseCountMap.set(c.stage_id, (caseCountMap.get(c.stage_id) ?? 0) + 1);
	}

	// Load quiz counts
	const { data: quizCounts } = await q(db, 'gj_quizzes')
		.select('stage_id')
		.eq('is_published', true)
		.in('stage_id', stageIds);

	const quizCountMap = new Map<string, number>();
	for (const qz of (quizCounts ?? []) as { stage_id: string }[]) {
		quizCountMap.set(qz.stage_id, (quizCountMap.get(qz.stage_id) ?? 0) + 1);
	}

	// Load completed material counts per stage for this user
	const { data: matProgressRows } = await q(db, 'gj_material_progress')
		.select('material_id, status')
		.eq('user_id', userId)
		.eq('status', 'COMPLETED');

	// Join materials to get stage_id
	const completedMaterialIds = new Set(
		((matProgressRows ?? []) as { material_id: string; status: string }[]).map(
			(mp) => mp.material_id
		)
	);

	const { data: allMaterials } = await q(db, 'gj_materials')
		.select('id, stage_id')
		.in('stage_id', stageIds);

	const completedPerStage = new Map<string, number>();
	for (const m of (allMaterials ?? []) as { id: string; stage_id: string }[]) {
		if (completedMaterialIds.has(m.id)) {
			completedPerStage.set(m.stage_id, (completedPerStage.get(m.stage_id) ?? 0) + 1);
		}
	}

	const stagesWithCounts: StageWithCounts[] = stageList.map((stage) => ({
		...stage,
		material_count: matCountMap.get(stage.id) ?? 0,
		case_count: caseCountMap.get(stage.id) ?? 0,
		quiz_count: quizCountMap.get(stage.id) ?? 0,
		attachment_count: 0,
		user_progress: progressMap.get(stage.id) ?? null,
		completed_material_count: completedPerStage.get(stage.id) ?? 0
	}));

	const completed = stagesWithCounts.filter((s) => s.user_progress?.status === 'COMPLETED').length;
	const inProgress = stagesWithCounts.filter(
		(s) => s.user_progress?.status === 'IN_PROGRESS'
	).length;
	const pointsEarned = stagesWithCounts
		.filter((s) => s.user_progress?.status === 'COMPLETED')
		.reduce((sum, s) => sum + s.points_reward, 0);

	return {
		total_stages: stageList.length,
		completed_stages: completed,
		in_progress_stages: inProgress,
		total_points_earned: pointsEarned,
		stages: stagesWithCounts
	};
}

/**
 * Load a single stage detail with materials, cases, quizzes, and user progress.
 * Returns null if not found or not visible to the user.
 */
export async function getStageDetail(
	db: DbClient,
	stageId: string,
	userId: string
): Promise<StageDetail | null> {
	const { data: stage } = await q(db, 'gj_stages').select('*').eq('id', stageId).single();

	if (!stage) return null;

	// Stage number = rank by sort_order among all published stages
	const { data: allStages } = await q(db, 'gj_stages')
		.select('id, sort_order')
		.eq('is_published', true)
		.order('sort_order');

	const stageNumber =
		((allStages ?? []) as { id: string; sort_order: number }[]).findIndex((s) => s.id === stageId) +
		1;

	// Materials with content blocks and attachments
	const { data: materials } = await q(db, 'gj_materials')
		.select('*')
		.eq('stage_id', stageId)
		.eq('is_published', true)
		.order('sort_order');

	const materialList = (materials ?? []) as Tables<'gj_materials'>[];
	const materialIds = materialList.map((m) => m.id);

	const materialsWithContent: MaterialWithContent[] = [];

	if (materialIds.length > 0) {
		const { data: contentBlocks } = await q(db, 'gj_material_content')
			.select('*, drive_file:drive_files(*)')
			.in('material_id', materialIds)
			.order('sort_order');

		const { data: attachmentRows } = await q(db, 'gj_attachments')
			.select('*, drive_file:drive_files(*)')
			.in('material_id', materialIds)
			.order('sequence');

		const contentByMaterial = new Map<string, MaterialContentWithFile[]>();
		for (const block of (contentBlocks ?? []) as MaterialContentWithFile[]) {
			const existing = contentByMaterial.get(block.material_id) ?? [];
			existing.push(block);
			contentByMaterial.set(block.material_id, existing);
		}

		const attachmentsByMaterial = new Map<
			string,
			Array<Tables<'gj_attachments'> & { drive_file: Tables<'drive_files'> }>
		>();
		for (const att of attachmentRows ?? []) {
			const existing = attachmentsByMaterial.get(att.material_id) ?? [];
			existing.push(att);
			attachmentsByMaterial.set(att.material_id, existing);
		}

		for (const mat of materialList) {
			materialsWithContent.push({
				...mat,
				content_blocks: contentByMaterial.get(mat.id) ?? [],
				attachments: attachmentsByMaterial.get(mat.id) ?? []
			});
		}
	}

	// Cases and quizzes
	const { data: cases } = await q(db, 'gj_cases')
		.select('*')
		.eq('stage_id', stageId)
		.eq('is_published', true)
		.order('sort_order');

	const { data: quizzes } = await q(db, 'gj_quizzes')
		.select('*')
		.eq('stage_id', stageId)
		.eq('is_published', true)
		.order('sort_order');

	// User progress
	const { data: stageProgress } = await q(db, 'gj_user_progress')
		.select('*')
		.eq('user_id', userId)
		.eq('stage_id', stageId)
		.maybeSingle();

	const { data: matProgress } = await q(db, 'gj_material_progress')
		.select('*')
		.eq('user_id', userId)
		.in('material_id', materialIds.length > 0 ? materialIds : ['none']);

	const quizIds = (quizzes ?? []).map((qz: { id: string }) => qz.id);
	const { data: quizAttempts } = await q(db, 'gj_quiz_attempts')
		.select('*')
		.eq('user_id', userId)
		.in('quiz_id', quizIds.length > 0 ? quizIds : ['none'])
		.order('started_at', { ascending: false });

	return {
		...stage,
		stage_number: stageNumber,
		materials: materialsWithContent,
		cases: (cases ?? []) as Tables<'gj_cases'>[],
		quizzes: (quizzes ?? []) as Tables<'gj_quizzes'>[],
		user_progress: (stageProgress as Tables<'gj_user_progress'>) ?? null,
		material_progresses: (matProgress ?? []) as Tables<'gj_material_progress'>[],
		quiz_attempts: (quizAttempts ?? []) as Tables<'gj_quiz_attempts'>[]
	};
}

// ── Material queries ─────────────────────────────────────────

export async function getMaterialWithContent(
	db: DbClient,
	materialId: string
): Promise<MaterialWithContent | null> {
	const { data: material } = await q(db, 'gj_materials').select('*').eq('id', materialId).single();

	if (!material) return null;

	const { data: blocks } = await q(db, 'gj_material_content')
		.select('*, drive_file:drive_files(*)')
		.eq('material_id', materialId)
		.order('sort_order');

	const { data: attachments } = await q(db, 'gj_attachments')
		.select('*, drive_file:drive_files(*)')
		.eq('material_id', materialId)
		.order('sequence');

	return {
		...material,
		content_blocks: (blocks ?? []) as MaterialContentWithFile[],
		attachments: (attachments ?? []) as Array<
			Tables<'gj_attachments'> & { drive_file: Tables<'drive_files'> }
		>
	};
}

// ── Progress mutations ───────────────────────────────────────

export async function markMaterialInProgress(
	db: DbClient,
	userId: string,
	materialId: string
): Promise<void> {
	await q(db, 'gj_material_progress').upsert(
		{ user_id: userId, material_id: materialId, status: 'IN_PROGRESS' },
		{ onConflict: 'user_id,material_id' }
	);
}

export async function markMaterialCompleted(
	db: DbClient,
	userId: string,
	materialId: string
): Promise<void> {
	await q(db, 'gj_material_progress').upsert(
		{
			user_id: userId,
			material_id: materialId,
			status: 'COMPLETED',
			completed_at: new Date().toISOString()
		},
		{ onConflict: 'user_id,material_id' }
	);
}

export async function updateStageProgress(
	db: DbClient,
	userId: string,
	stageId: string
): Promise<void> {
	// Compute stage status from material progresses
	const { data: materials } = await q(db, 'gj_materials')
		.select('id, is_required')
		.eq('stage_id', stageId)
		.eq('is_published', true);

	const matList = (materials ?? []) as { id: string; is_required: boolean }[];
	if (matList.length === 0) return;

	const matIds = matList.map((m) => m.id);

	const { data: progresses } = await q(db, 'gj_material_progress')
		.select('material_id, status')
		.eq('user_id', userId)
		.in('material_id', matIds);

	const progressMap = new Map(
		((progresses ?? []) as { material_id: string; status: string }[]).map((p) => [
			p.material_id,
			p.status
		])
	);

	const requiredMats = matList.filter((m) => m.is_required);
	const allRequiredDone = requiredMats.every((m) => progressMap.get(m.id) === 'COMPLETED');
	const anyStarted = matList.some((m) =>
		['IN_PROGRESS', 'COMPLETED'].includes(progressMap.get(m.id) ?? '')
	);

	const newStatus = allRequiredDone ? 'COMPLETED' : anyStarted ? 'IN_PROGRESS' : 'NOT_STARTED';

	await q(db, 'gj_user_progress').upsert(
		{
			user_id: userId,
			stage_id: stageId,
			status: newStatus,
			completed_at: allRequiredDone ? new Date().toISOString() : null
		},
		{ onConflict: 'user_id,stage_id' }
	);
}

// ── Quiz ─────────────────────────────────────────────────────

export async function getQuizWithQuestions(
	db: DbClient,
	quizId: string
): Promise<QuizWithQuestions | null> {
	const { data: quiz } = await q(db, 'gj_quizzes').select('*').eq('id', quizId).single();
	if (!quiz) return null;

	const { data: questions } = await q(db, 'gj_quiz_questions')
		.select('*')
		.eq('quiz_id', quizId)
		.order('sort_order');

	const qIds = (questions ?? []).map((qn: { id: string }) => qn.id);
	const { data: options } = qIds.length
		? await q(db, 'gj_quiz_options').select('*').in('question_id', qIds).order('sort_order')
		: { data: [] };

	const optionsByQuestion = new Map<string, Tables<'gj_quiz_options'>[]>();
	for (const opt of (options ?? []) as Tables<'gj_quiz_options'>[]) {
		const existing = optionsByQuestion.get(opt.question_id) ?? [];
		existing.push(opt);
		optionsByQuestion.set(opt.question_id, existing);
	}

	return {
		...quiz,
		questions: (questions ?? []).map((qn: Tables<'gj_quiz_questions'>) => ({
			...qn,
			options: optionsByQuestion.get(qn.id) ?? []
		}))
	};
}

export async function submitQuiz(
	db: DbClient,
	userId: string,
	submission: QuizSubmission
): Promise<QuizResult> {
	const quiz = await getQuizWithQuestions(db, submission.quiz_id);
	if (!quiz) throw new Error('Quiz not found');

	// Build correct answer map
	const correctByQuestion = new Map<string, string>();
	for (const qn of quiz.questions) {
		const correct = qn.options.find((o) => o.is_correct);
		if (correct) correctByQuestion.set(qn.id, correct.id);
	}

	// Evaluate answers
	let correct = 0;
	const perQuestion: QuizResult['per_question'] = [];

	for (const qn of quiz.questions) {
		const submitted = submission.answers.find((a) => a.question_id === qn.id);
		const selectedOptionId = submitted?.option_id ?? null;
		const correctOptionId = correctByQuestion.get(qn.id) ?? null;
		const isCorrect = selectedOptionId != null && selectedOptionId === correctOptionId;
		if (isCorrect) correct++;

		perQuestion.push({
			question_id: qn.id,
			question_text: qn.question_text,
			selected_option_id: selectedOptionId,
			correct_option_id: correctOptionId,
			is_correct: isCorrect,
			explanation: qn.explanation
		});
	}

	const totalQ = quiz.questions.length;
	const score = totalQ > 0 ? Math.round((correct / totalQ) * 100) : 0;
	const passed = score >= quiz.passing_score;

	// Insert attempt
	const { data: attempt } = await q(db, 'gj_quiz_attempts')
		.insert({
			user_id: userId,
			quiz_id: quiz.id,
			score,
			passed,
			started_at: new Date().toISOString(),
			completed_at: new Date().toISOString()
		})
		.select()
		.single();

	// Insert answers
	const answerRows = perQuestion.map((pq) => ({
		attempt_id: (attempt as Tables<'gj_quiz_attempts'>).id,
		question_id: pq.question_id,
		option_id: pq.selected_option_id,
		is_correct: pq.is_correct
	}));

	if (answerRows.length > 0) {
		await q(db, 'gj_quiz_answers').insert(answerRows);
	}

	return {
		attempt: attempt as Tables<'gj_quiz_attempts'>,
		score,
		passed,
		total_questions: totalQ,
		correct_answers: correct,
		per_question: perQuestion
	};
}

// ── Admin CRUD ───────────────────────────────────────────────

export async function listAllStages(db: DbClient): Promise<Tables<'gj_stages'>[]> {
	const { data } = await q(db, 'gj_stages').select('*').order('sort_order');
	return (data ?? []) as Tables<'gj_stages'>[];
}

export async function createStage(
	db: DbClient,
	insert: TablesInsert<'gj_stages'>
): Promise<Tables<'gj_stages'>> {
	const { data, error } = await q(db, 'gj_stages').insert(insert).select().single();
	if (error) throw new Error(error.message);
	return data as Tables<'gj_stages'>;
}

export async function updateStage(
	db: DbClient,
	id: string,
	update: TablesUpdate<'gj_stages'>
): Promise<Tables<'gj_stages'>> {
	const { data, error } = await q(db, 'gj_stages').update(update).eq('id', id).select().single();
	if (error) throw new Error(error.message);
	return data as Tables<'gj_stages'>;
}

export async function createMaterial(
	db: DbClient,
	insert: TablesInsert<'gj_materials'>
): Promise<Tables<'gj_materials'>> {
	const { data, error } = await q(db, 'gj_materials').insert(insert).select().single();
	if (error) throw new Error(error.message);
	return data as Tables<'gj_materials'>;
}

export async function updateMaterial(
	db: DbClient,
	id: string,
	update: TablesUpdate<'gj_materials'>
): Promise<Tables<'gj_materials'>> {
	const { data, error } = await q(db, 'gj_materials').update(update).eq('id', id).select().single();
	if (error) throw new Error(error.message);
	return data as Tables<'gj_materials'>;
}

export async function addContentBlock(
	db: DbClient,
	insert: TablesInsert<'gj_material_content'>
): Promise<Tables<'gj_material_content'>> {
	const { data, error } = await q(db, 'gj_material_content').insert(insert).select().single();
	if (error) throw new Error(error.message);
	return data as Tables<'gj_material_content'>;
}

export async function attachFileToMaterial(
	db: DbClient,
	insert: TablesInsert<'gj_attachments'>
): Promise<Tables<'gj_attachments'>> {
	const { data, error } = await q(db, 'gj_attachments').insert(insert).select().single();
	if (error) throw new Error(error.message);
	return data as Tables<'gj_attachments'>;
}

import type { TablesInsert as TI, TablesUpdate as TU } from '$lib/types/database.types';
// Re-export to suppress unused import lint
export type { TI as _TI, TU as _TU };
