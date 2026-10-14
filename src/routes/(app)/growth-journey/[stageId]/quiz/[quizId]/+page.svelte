<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import type { QuizResultV2 } from '$lib/types/growth-journey.types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const quiz = $derived(data.quiz);
	const stageId = $derived(data.stageId);
	const attemptResult = $derived(data.attemptResult as QuizResultV2 | null);

	let submitting = $state(false);
	let starting = $state(false);
	// Mutable attempt ID — updated by start/submit form actions.
	// Initialised via $effect so Svelte 5 reactivity is respected.
	let attemptId: string | null = $state(null);
	$effect(() => {
		if (attemptId === null && data.quiz.active_attempt?.id) {
			attemptId = data.quiz.active_attempt.id;
		}
	});

	// Expiry label
	const expiryLabel = $derived(() => {
		const exp = quiz.expiry_status;
		if (!exp.refresh_days) return null;
		if (exp.is_expired) return 'PERLU DIULANG';
		if (exp.expires_at) {
			const d = new Date(exp.expires_at);
			return `Berlaku hingga ${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
		}
		return null;
	});

	// Status badge
	const statusInfo = $derived(() => {
		if (attemptResult)
			return {
				label: attemptResult.passed ? '✅ Lulus' : '❌ Belum Lulus',
				cls: attemptResult.passed ? 'passed' : 'failed'
			};
		if (quiz.expiry_status.is_expired) return { label: '⟳ Perlu Diulang', cls: 'expired' };
		if (quiz.best_score !== null && quiz.best_score >= quiz.passing_score)
			return { label: `✅ Lulus (${quiz.best_score}%)`, cls: 'passed' };
		if (quiz.attempt_count > 0)
			return { label: `Belum Lulus (${quiz.best_score ?? 0}%)`, cls: 'failed' };
		return null;
	});
</script>

<svelte:head>
	<title>{quiz.title} — Kuis — ALC</title>
</svelte:head>

<div class="page">
	<!-- Breadcrumb -->
	<nav class="breadcrumb" aria-label="Breadcrumb">
		<a href="/growth-journey">Growth Journey</a>
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg
		>
		<a href="/growth-journey/{stageId}">Stage</a>
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg
		>
		<span aria-current="page">{quiz.title}</span>
	</nav>

	<!-- Quiz header -->
	<div class="quiz-header">
		<div class="quiz-header-top">
			<h1 class="quiz-title">✏️ {quiz.title}</h1>
			{#if statusInfo()}
				<span class="status-badge {statusInfo()?.cls}">{statusInfo()?.label}</span>
			{/if}
		</div>
		{#if quiz.description}<p class="quiz-desc">{quiz.description}</p>{/if}

		<div class="quiz-meta">
			<span>Nilai lulus: <strong>{quiz.passing_score}%</strong></span>
			{#if quiz.time_limit_min}<span>⏱ {quiz.time_limit_min} menit</span>{/if}
			<span>{quiz.questions.length} pertanyaan</span>
			{#if quiz.max_attempts}<span>Maks. {quiz.max_attempts}x percobaan</span>{/if}
			{#if quiz.attempt_count > 0}<span>Sudah dicoba: {quiz.attempt_count}x</span>{/if}
			{#if expiryLabel()}
				<span class="expiry-label" class:expired-label={quiz.expiry_status.is_expired}>
					{expiryLabel()}
				</span>
			{/if}
		</div>

		{#if form?.error}
			<div class="alert-error">{form.error}</div>
		{/if}
	</div>

	<!-- ─── RESULT VIEW ────────────────────────────────────────── -->
	{#if attemptResult}
		<div
			class="result-card"
			class:passed={attemptResult.passed}
			class:failed={!attemptResult.passed}
		>
			<div class="result-score">{attemptResult.score}%</div>
			<div class="result-label">{attemptResult.passed ? '🎉 Lulus!' : '❌ Belum Lulus'}</div>
			<div class="result-detail">
				{attemptResult.correct_answers}/{attemptResult.total_questions} benar · {attemptResult.points_earned}/{attemptResult.points_possible}
				poin
			</div>
		</div>

		<!-- Per-question review -->
		<div class="breakdown">
			<h2 class="breakdown-title">Pembahasan Jawaban</h2>
			{#each attemptResult.per_question as pq, i (pq.question_id)}
				<div class="breakdown-item" class:correct={pq.is_correct} class:incorrect={!pq.is_correct}>
					<div class="breakdown-num">{i + 1}</div>
					<div class="breakdown-body">
						{#if pq.attachment?.drive_file}
							<div class="q-attachment">
								{#if pq.attachment.attachment_type === 'IMAGE'}
									<img
										src="/api/files/{pq.attachment.drive_file.id}/stream"
										alt={pq.attachment.display_name ?? 'Gambar pertanyaan'}
										class="q-image"
										loading="lazy"
									/>
								{:else}
									<a
										href="/api/files/{pq.attachment.drive_file.id}/stream"
										target="_blank"
										rel="noopener noreferrer"
										class="q-doc-link"
									>
										📎 {pq.attachment.display_name ?? pq.attachment.drive_file.name}
									</a>
								{/if}
							</div>
						{/if}
						<p class="breakdown-q">{pq.question_text}</p>
						{#if pq.explanation}
							<p class="breakdown-exp">💡 {pq.explanation}</p>
						{/if}
						<p class="breakdown-points">{pq.points} poin</p>
					</div>
					<div class="breakdown-icon" aria-label={pq.is_correct ? 'Benar' : 'Salah'}>
						{pq.is_correct ? '✓' : '✗'}
					</div>
				</div>
			{/each}
		</div>

		<div class="result-actions">
			<a href="/growth-journey/{stageId}" class="btn-back">← Kembali ke Stage</a>
			{#if !attemptResult.passed && quiz.can_attempt}
				<form
					method="POST"
					action="?/start"
					use:enhance={() => {
						starting = true;
						return async ({ result, update }) => {
							starting = false;
							if (result.type === 'success' && result.data?.attemptId) {
								attemptId = result.data.attemptId as string;
							}
							await update();
						};
					}}
				>
					<button type="submit" class="btn-retry" disabled={starting}>
						{starting ? 'Memulai…' : '↺ Coba Lagi'}
					</button>
				</form>
			{/if}
		</div>

		<!-- ─── QUIZ FORM ─────────────────────────────────────────── -->
	{:else if attemptId}
		<form
			method="POST"
			action="?/submit"
			class="quiz-form"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					submitting = false;
					await update();
				};
			}}
		>
			<input type="hidden" name="attempt_id" value={attemptId} />

			<div class="questions-list">
				{#each quiz.questions as qn, i (qn.id)}
					<fieldset class="question-card" id="q-{qn.id}">
						<legend class="question-text">
							<span class="q-num">{i + 1}.</span>
							{qn.question_text}
							{#if qn.points > 1}
								<span class="q-points">({qn.points} poin)</span>
							{/if}
						</legend>

						<!-- Question attachment (image/video/doc) -->
						{#if qn.attachment?.drive_file}
							<div class="q-attachment-preview">
								{#if qn.attachment.attachment_type === 'IMAGE'}
									<img
										src="/api/files/{qn.attachment.drive_file.id}/stream"
										alt={qn.attachment.display_name ?? 'Gambar pertanyaan'}
										class="q-image"
										loading="lazy"
									/>
								{:else if qn.attachment.attachment_type === 'VIDEO'}
									<video controls preload="metadata" class="q-video">
										<source
											src="/api/files/{qn.attachment.drive_file.id}/stream"
											type={qn.attachment.drive_file.mime_type}
										/>
									</video>
								{:else}
									<a
										href="/api/files/{qn.attachment.drive_file.id}/stream"
										target="_blank"
										rel="noopener noreferrer"
										class="q-doc-link"
									>
										📎 {qn.attachment.display_name ?? qn.attachment.drive_file.name}
									</a>
								{/if}
							</div>
						{/if}

						<ul class="options-list" role="radiogroup">
							{#each qn.options as opt (opt.id)}
								<li>
									<label class="option-label">
										<input type="radio" name="q_{qn.id}" value={opt.id} required />
										<span class="option-text">{opt.option_text}</span>
									</label>
								</li>
							{/each}
						</ul>
					</fieldset>
				{/each}
			</div>

			<div class="submit-row">
				<button type="submit" class="btn-submit" disabled={submitting}>
					{submitting ? 'Mengirim…' : 'Kirim Jawaban'}
				</button>
			</div>
		</form>

		<!-- Abandon sits outside the submit form to avoid nested forms -->
		<form method="POST" action="?/abandon">
			<input type="hidden" name="attempt_id" value={attemptId} />
			<button type="submit" class="btn-abandon">Batalkan</button>
		</form>

		<!-- ─── START SCREEN ──────────────────────────────────────── -->
	{:else}
		<div class="start-card">
			{#if quiz.can_attempt}
				<p class="start-desc">
					Kerjakan semua {quiz.questions.length} pertanyaan. Nilai minimum lulus:
					<strong>{quiz.passing_score}%</strong>.
					{#if quiz.time_limit_min}Batas waktu: {quiz.time_limit_min} menit.{/if}
				</p>
				<form
					method="POST"
					action="?/start"
					use:enhance={() => {
						starting = true;
						return async ({ result, update }) => {
							starting = false;
							if (result.type === 'success' && result.data?.attemptId) {
								attemptId = result.data.attemptId as string;
							}
							await update();
						};
					}}
				>
					<button type="submit" class="btn-start" disabled={starting}>
						{starting ? 'Memulai…' : 'Mulai Kuis'}
					</button>
				</form>
			{:else}
				<p class="no-attempt">
					{#if quiz.max_attempts && quiz.attempt_count >= quiz.max_attempts}
						Batas percobaan ({quiz.max_attempts}x) telah habis.
					{:else}
						Kuis ini tidak dapat dikerjakan saat ini.
					{/if}
				</p>
			{/if}
		</div>
		<a href="/growth-journey/{stageId}" class="btn-back">← Kembali ke Stage</a>
	{/if}
</div>

<style>
	.page {
		max-width: 720px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.875rem;
		color: var(--color-muted);
	}
	.breadcrumb a {
		color: var(--color-primary);
		text-decoration: none;
	}

	.quiz-header {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}
	.quiz-header-top {
		display: flex;
		align-items: flex-start;
		gap: 0.875rem;
		flex-wrap: wrap;
	}
	.quiz-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0;
		flex: 1;
	}
	.quiz-desc {
		margin: 0;
		color: var(--color-text-secondary);
	}
	.quiz-meta {
		display: flex;
		gap: 0.75rem;
		font-size: 0.8125rem;
		color: var(--color-muted);
		flex-wrap: wrap;
	}
	.expiry-label {
		font-weight: 600;
		color: var(--color-muted);
	}
	.expired-label {
		color: var(--color-warning);
		font-weight: 700;
	}

	.status-badge {
		font-size: 0.8rem;
		font-weight: 700;
		padding: 0.25rem 0.75rem;
		border-radius: 999px;
		flex-shrink: 0;
	}
	.status-badge.passed {
		background: color-mix(in srgb, var(--color-success) 15%, transparent);
		color: color-mix(in srgb, var(--color-success) 80%, black);
	}
	.status-badge.failed {
		background: color-mix(in srgb, var(--color-error) 15%, transparent);
		color: var(--color-error);
	}
	.status-badge.expired {
		background: color-mix(in srgb, var(--color-warning) 15%, transparent);
		color: var(--color-warning-dark, var(--color-warning));
	}

	.alert-error {
		padding: 0.75rem 1rem;
		background: var(--color-error-bg);
		color: var(--color-error);
		border-radius: var(--radius-md);
		font-size: 0.875rem;
	}

	/* Result */
	.result-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 2rem;
		background: var(--color-surface);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-xl);
		text-align: center;
	}
	.result-card.passed {
		border-color: var(--color-success);
		background: var(--color-success-bg);
	}
	.result-card.failed {
		border-color: var(--color-error);
		background: var(--color-error-bg);
	}
	.result-score {
		font-size: 3.5rem;
		font-weight: 800;
		color: var(--color-text);
		line-height: 1;
	}
	.result-label {
		font-size: 1.375rem;
		font-weight: 700;
	}
	.result-detail {
		font-size: 0.9375rem;
		color: var(--color-text-secondary);
	}

	.breakdown {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.breakdown-title {
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0;
	}
	.breakdown-item {
		display: flex;
		gap: 0.875rem;
		align-items: flex-start;
		padding: 0.875rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}
	.breakdown-item.correct {
		border-color: color-mix(in srgb, var(--color-success) 40%, transparent);
		background: var(--color-success-bg);
	}
	.breakdown-item.incorrect {
		border-color: color-mix(in srgb, var(--color-error) 30%, transparent);
		background: var(--color-error-bg);
	}
	.breakdown-num {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--color-bg-subtle);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.8125rem;
		font-weight: 700;
		flex-shrink: 0;
	}
	.breakdown-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.breakdown-q {
		margin: 0;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-text);
	}
	.breakdown-exp {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--color-text-secondary);
	}
	.breakdown-points {
		margin: 0;
		font-size: 0.75rem;
		color: var(--color-muted);
	}
	.breakdown-icon {
		font-size: 1rem;
		font-weight: 700;
		flex-shrink: 0;
		padding-top: 0.25rem;
	}
	.breakdown-item.correct .breakdown-icon {
		color: var(--color-success);
	}
	.breakdown-item.incorrect .breakdown-icon {
		color: var(--color-error);
	}

	.result-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.btn-retry {
		padding: 0.5rem 1.25rem;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
	}
	.btn-retry:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* Quiz form */
	.quiz-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.questions-list {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.question-card {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.125rem 1.25rem;
		background: var(--color-surface);
	}
	.question-text {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-text);
		display: flex;
		gap: 0.375rem;
		align-items: baseline;
		flex-wrap: wrap;
		margin-bottom: 0.875rem;
	}
	.q-num {
		color: var(--color-primary);
		flex-shrink: 0;
		font-weight: 700;
	}
	.q-points {
		font-size: 0.75rem;
		color: var(--color-muted);
		font-weight: 400;
	}

	.q-attachment-preview {
		margin-bottom: 0.875rem;
	}
	.q-image {
		max-width: 100%;
		border-radius: var(--radius-md);
		display: block;
	}
	.q-video {
		width: 100%;
		border-radius: var(--radius-md);
		background: #000;
	}
	.q-doc-link {
		font-size: 0.875rem;
		color: var(--color-primary);
		text-decoration: underline;
	}

	.options-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.option-label {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		cursor: pointer;
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		transition:
			background 0.1s,
			border-color 0.1s;
	}
	.option-label:hover {
		background: var(--color-bg-subtle);
		border-color: var(--color-secondary);
	}
	:global(.option-label:has(input:checked)) {
		background: color-mix(in srgb, var(--color-primary) 8%, transparent);
		border-color: var(--color-primary);
	}
	.option-text {
		font-size: 0.9rem;
		color: var(--color-text);
	}

	.submit-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.btn-submit {
		padding: 0.625rem 1.5rem;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-md);
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s;
	}
	.btn-submit:hover:not(:disabled) {
		background: var(--color-primary-light);
	}
	.btn-submit:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.btn-abandon {
		padding: 0.5rem 1rem;
		background: none;
		color: var(--color-muted);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		cursor: pointer;
	}
	.btn-abandon:hover {
		border-color: var(--color-error);
		color: var(--color-error);
	}
	.start-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
		padding: 1.75rem;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 1.25rem;
	}
	.start-desc {
		margin: 0;
		font-size: 0.9375rem;
		color: var(--color-text-secondary);
		line-height: 1.6;
	}
	.btn-start {
		padding: 0.75rem 2rem;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-md);
		font-size: 1rem;
		font-weight: 700;
		cursor: pointer;
	}
	.btn-start:hover:not(:disabled) {
		background: var(--color-primary-light);
	}
	.btn-start:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.no-attempt {
		color: var(--color-muted);
		font-style: italic;
		margin: 0;
	}

	.btn-back {
		color: var(--color-primary);
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
	}
	.btn-back:hover {
		text-decoration: underline;
	}

	/* Attachment in breakdown */
	.q-attachment {
		margin-bottom: 0.5rem;
	}
</style>
