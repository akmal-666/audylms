// ============================================================
// Content Modules Service — SERVER ONLY
// Shared query patterns for all Phase 6 modules.
// ============================================================

import type { createSupabaseServerClient } from '$lib/server/supabase';
import type { Tables, TablesInsert } from '$lib/types/database.types';

type DbClient = ReturnType<typeof createSupabaseServerClient>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const q = (db: DbClient, table: string) => (db as any).from(table);

// ══ Product Knowledge ════════════════════════════════════════

export async function listPkCategories(db: DbClient): Promise<Tables<'pk_categories'>[]> {
	const { data } = await q(db, 'pk_categories')
		.select('*')
		.eq('is_published', true)
		.order('sort_order');
	return (data ?? []) as Tables<'pk_categories'>[];
}

export async function listPkTopics(
	db: DbClient,
	categoryId: string
): Promise<Tables<'pk_topics'>[]> {
	const { data } = await q(db, 'pk_topics')
		.select('*')
		.eq('category_id', categoryId)
		.eq('is_published', true)
		.order('sort_order');
	return (data ?? []) as Tables<'pk_topics'>[];
}

export async function getPkTopicWithSections(
	db: DbClient,
	topicId: string,
	userId: string
): Promise<{
	topic: Tables<'pk_topics'>;
	sections: Array<Tables<'pk_sections'> & { drive_file: Tables<'drive_files'> | null }>;
	progress: Tables<'pk_progress'> | null;
} | null> {
	const { data: topic } = await q(db, 'pk_topics')
		.select('*')
		.eq('id', topicId)
		.eq('is_published', true)
		.single();
	if (!topic) return null;

	const { data: sections } = await q(db, 'pk_sections')
		.select('*, drive_file:drive_files(*)')
		.eq('topic_id', topicId)
		.order('sort_order');
	const { data: progress } = await q(db, 'pk_progress')
		.select('*')
		.eq('user_id', userId)
		.eq('topic_id', topicId)
		.maybeSingle();

	return {
		topic: topic as Tables<'pk_topics'>,
		sections: (sections ?? []) as Array<
			Tables<'pk_sections'> & { drive_file: Tables<'drive_files'> | null }
		>,
		progress: (progress as Tables<'pk_progress'>) ?? null
	};
}

export async function markPkTopicRead(
	db: DbClient,
	userId: string,
	topicId: string
): Promise<void> {
	await q(db, 'pk_progress').upsert(
		{
			user_id: userId,
			topic_id: topicId,
			status: 'COMPLETED',
			completed_at: new Date().toISOString()
		},
		{ onConflict: 'user_id,topic_id' }
	);
}

// ══ Play & Learn ═════════════════════════════════════════════

/**
 * Get game items with answer STRIPPED for employee view.
 */
export async function getGameForEmployee(
	db: DbClient,
	gameId: string
): Promise<{
	game: Tables<'pl_games'>;
	items: Array<{
		id: string;
		sort_order: number;
		prompt: string;
		options: unknown;
		drive_file: Tables<'drive_files'> | null;
	}>;
} | null> {
	const { data: game } = await q(db, 'pl_games')
		.select('*')
		.eq('id', gameId)
		.eq('is_published', true)
		.single();
	if (!game) return null;

	const { data: items } = await q(db, 'pl_game_items')
		.select('id, sort_order, prompt, options, drive_file:drive_files(*)')
		.eq('game_id', gameId)
		.order('sort_order');

	return {
		game: game as Tables<'pl_games'>,
		items: (items ?? []) as Array<{
			id: string;
			sort_order: number;
			prompt: string;
			options: unknown;
			drive_file: Tables<'drive_files'> | null;
		}>
	};
}

/**
 * Submit game answers — server scores, answer never trusted from client.
 */
export async function submitGame(
	db: DbClient,
	userId: string,
	gameId: string,
	answers: Record<string, string>
): Promise<{ score: number; passed: boolean; points_earned: number }> {
	const { data: game } = await q(db, 'pl_games')
		.select('passing_score, points_reward')
		.eq('id', gameId)
		.single();
	const { data: items } = await q(db, 'pl_game_items')
		.select('id, answer, points')
		.eq('game_id', gameId);

	let correct = 0;
	for (const item of (items ?? []) as Tables<'pl_game_items'>[]) {
		if ((answers[item.id] ?? '').trim().toLowerCase() === item.answer.trim().toLowerCase())
			correct++;
	}

	const total = (items ?? []).length;
	const score = total > 0 ? Math.round((correct / total) * 100) : 0;
	const passed = score >= (game as Tables<'pl_games'>).passing_score;
	const pointsEarned = passed ? (game as Tables<'pl_games'>).points_reward : 0;

	await q(db, 'pl_attempts').upsert(
		{
			user_id: userId,
			game_id: gameId,
			score,
			passed,
			points_earned: pointsEarned,
			submitted_at: new Date().toISOString(),
			status: 'COMPLETED'
		},
		{ onConflict: 'user_id,game_id' }
	);

	return { score, passed, points_earned: pointsEarned };
}

// ══ Lets Practice ════════════════════════════════════════════

export async function listLpPractices(db: DbClient): Promise<Tables<'lp_practices'>[]> {
	const { data } = await q(db, 'lp_practices')
		.select('*, drive_file:drive_files(*)')
		.eq('is_published', true)
		.order('sort_order');
	return (data ?? []) as Tables<'lp_practices'>[];
}

export async function markPracticeComplete(
	db: DbClient,
	userId: string,
	practiceId: string
): Promise<void> {
	await q(db, 'lp_completions').upsert(
		{ user_id: userId, practice_id: practiceId },
		{ onConflict: 'user_id,practice_id' }
	);
}

// ══ Tanya Jawab ══════════════════════════════════════════════

export async function listQnaQuestions(
	db: DbClient,
	options: { limit?: number; offset?: number; resolved?: boolean } = {}
): Promise<{
	questions: Array<
		Tables<'qna_questions'> & {
			author: Pick<Tables<'profiles'>, 'id' | 'full_name'> | null;
			answer_count: number;
		}
	>;
	total: number;
}> {
	let base = q(db, 'qna_questions')
		.select('*, author:profiles(id, full_name)', { count: 'exact' })
		.eq('is_published', true)
		.order('created_at', { ascending: false });
	if (options.resolved !== undefined) base = base.eq('is_resolved', options.resolved);
	base = base.range(options.offset ?? 0, (options.offset ?? 0) + (options.limit ?? 20) - 1);

	const { data, count } = await base;

	const questions = data ?? [];
	// Get answer counts
	const ids = questions.map((q: { id: string }) => q.id);
	const answerCounts: Record<string, number> = {};
	if (ids.length > 0) {
		const { data: answers } = await q(db, 'qna_answers')
			.select('question_id')
			.in('question_id', ids);
		for (const a of (answers ?? []) as { question_id: string }[]) {
			answerCounts[a.question_id] = (answerCounts[a.question_id] ?? 0) + 1;
		}
	}

	return {
		questions: questions.map(
			(
				item: Tables<'qna_questions'> & {
					author: Pick<Tables<'profiles'>, 'id' | 'full_name'> | null;
				}
			) => ({ ...item, answer_count: answerCounts[item.id] ?? 0 })
		),
		total: count ?? 0
	};
}

export async function getQnaQuestion(
	db: DbClient,
	questionId: string
): Promise<{
	question: Tables<'qna_questions'> & {
		author: Pick<Tables<'profiles'>, 'id' | 'full_name'> | null;
	};
	attachments: Array<Tables<'qna_attachments'> & { drive_file: Tables<'drive_files'> }>;
	answers: Array<
		Tables<'qna_answers'> & { author: Pick<Tables<'profiles'>, 'id' | 'full_name'> | null }
	>;
} | null> {
	const { data: question } = await q(db, 'qna_questions')
		.select('*, author:profiles(id, full_name)')
		.eq('id', questionId)
		.eq('is_published', true)
		.single();
	if (!question) return null;

	const [{ data: attachments }, { data: answers }] = await Promise.all([
		q(db, 'qna_attachments')
			.select('*, drive_file:drive_files(*)')
			.eq('question_id', questionId)
			.order('sequence'),
		q(db, 'qna_answers')
			.select('*, author:profiles(id, full_name)')
			.eq('question_id', questionId)
			.order('created_at')
	]);

	// Increment view count (fire-and-forget)
	void q(db, 'qna_questions')
		.update({ view_count: question.view_count + 1 })
		.eq('id', questionId);

	return {
		question: question as Tables<'qna_questions'> & {
			author: Pick<Tables<'profiles'>, 'id' | 'full_name'> | null;
		},
		attachments: (attachments ?? []) as Array<
			Tables<'qna_attachments'> & { drive_file: Tables<'drive_files'> }
		>,
		answers: (answers ?? []) as Array<
			Tables<'qna_answers'> & { author: Pick<Tables<'profiles'>, 'id' | 'full_name'> | null }
		>
	};
}

export async function postQnaAnswer(
	db: DbClient,
	insert: TablesInsert<'qna_answers'>
): Promise<Tables<'qna_answers'>> {
	const { data, error } = await q(db, 'qna_answers').insert(insert).select().single();
	if (error) throw new Error(error.message);
	return data as Tables<'qna_answers'>;
}

export async function verifyQnaAnswer(
	db: DbClient,
	answerId: string,
	verifiedBy: string
): Promise<void> {
	await q(db, 'qna_answers')
		.update({ is_verified: true, verified_by: verifiedBy, verified_at: new Date().toISOString() })
		.eq('id', answerId);
}

// ══ Ruang Aspirasi ═══════════════════════════════════════════

export async function submitAspiration(
	db: DbClient,
	insert: TablesInsert<'asp_submissions'>
): Promise<Tables<'asp_submissions'>> {
	const { data, error } = await q(db, 'asp_submissions').insert(insert).select().single();
	if (error) throw new Error(error.message);
	return data as Tables<'asp_submissions'>;
}

export async function listAspirations(db: DbClient): Promise<Tables<'asp_submissions'>[]> {
	const { data } = await q(db, 'asp_submissions')
		.select('*')
		.order('created_at', { ascending: false });
	return (data ?? []) as Tables<'asp_submissions'>[];
}

// ══ Fresh Update ═════════════════════════════════════════════

export async function listFuPosts(
	db: DbClient,
	limit = 20,
	offset = 0
): Promise<{
	posts: Array<Tables<'fu_posts'> & { cover: Tables<'drive_files'> | null }>;
	total: number;
}> {
	const { data, count } = await q(db, 'fu_posts')
		.select('*, cover:drive_files!fu_posts_cover_drive_file_id_fkey(*)', { count: 'exact' })
		.eq('is_published', true)
		.order('published_at', { ascending: false })
		.range(offset, offset + limit - 1);

	return {
		posts: (data ?? []) as Array<Tables<'fu_posts'> & { cover: Tables<'drive_files'> | null }>,
		total: count ?? 0
	};
}

export async function getFuPost(
	db: DbClient,
	postId: string,
	userId: string
): Promise<{
	post: Tables<'fu_posts'> & { cover: Tables<'drive_files'> | null };
	attachments: Array<Tables<'fu_attachments'> & { drive_file: Tables<'drive_files'> }>;
	is_read: boolean;
} | null> {
	const { data: post } = await q(db, 'fu_posts')
		.select('*, cover:drive_files!fu_posts_cover_drive_file_id_fkey(*)')
		.eq('id', postId)
		.eq('is_published', true)
		.single();
	if (!post) return null;

	const [{ data: attachments }, { data: readRow }] = await Promise.all([
		q(db, 'fu_attachments')
			.select('*, drive_file:drive_files(*)')
			.eq('post_id', postId)
			.order('sequence'),
		q(db, 'fu_reads').select('id').eq('user_id', userId).eq('post_id', postId).maybeSingle()
	]);

	return {
		post: post as Tables<'fu_posts'> & { cover: Tables<'drive_files'> | null },
		attachments: (attachments ?? []) as Array<
			Tables<'fu_attachments'> & { drive_file: Tables<'drive_files'> }
		>,
		is_read: !!readRow
	};
}

export async function markFuPostRead(db: DbClient, userId: string, postId: string): Promise<void> {
	await q(db, 'fu_reads').upsert(
		{ user_id: userId, post_id: postId },
		{ onConflict: 'user_id,post_id' }
	);
}

// ══ Notifications ════════════════════════════════════════════

export async function getUserNotifications(
	db: DbClient,
	userId: string,
	limit = 30
): Promise<{ notifications: Tables<'notifications'>[]; unread_count: number }> {
	const [{ data: notifs }, { count }] = await Promise.all([
		q(db, 'notifications')
			.select('*')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
			.limit(limit),
		q(db, 'notifications')
			.select('id', { count: 'exact', head: true })
			.eq('user_id', userId)
			.eq('is_read', false)
	]);

	return {
		notifications: (notifs ?? []) as Tables<'notifications'>[],
		unread_count: count ?? 0
	};
}

export async function markNotificationRead(
	db: DbClient,
	notificationId: string,
	userId: string
): Promise<void> {
	await q(db, 'notifications')
		.update({ is_read: true })
		.eq('id', notificationId)
		.eq('user_id', userId);
}

export async function markAllNotificationsRead(db: DbClient, userId: string): Promise<void> {
	await q(db, 'notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
}

export async function createNotification(
	userId: string,
	type: Tables<'notifications'>['type'],
	title: string,
	options?: { body?: string; action_url?: string }
): Promise<void> {
	const { createSupabaseAdminClient } = await import('$lib/server/supabase');
	const admin = createSupabaseAdminClient();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	await (admin as any).from('notifications').insert({
		user_id: userId,
		type,
		title,
		body: options?.body ?? null,
		action_url: options?.action_url ?? null
	});
}
