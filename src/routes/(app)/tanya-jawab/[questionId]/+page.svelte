<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import type { Tables } from '$lib/types/database.types';

	// Use explicit types — PageData inference collapses on complex joined objects
	interface QnaPageData {
		question: Tables<'qna_questions'> & {
			author: Pick<Tables<'profiles'>, 'id' | 'full_name'> | null;
		};
		attachments: Array<Tables<'qna_attachments'> & { drive_file: Tables<'drive_files'> }>;
		answers: Array<
			Tables<'qna_answers'> & {
				author: Pick<Tables<'profiles'>, 'id' | 'full_name'> | null;
			}
		>;
	}

	let { data, form }: { data: QnaPageData; form: ActionData } = $props();

	const question = $derived(data.question);
	const attachments = $derived(data.attachments);
	const answers = $derived(data.answers);
	let submitting = $state(false);
</script>

<svelte:head><title>{question.title} — Tanya Jawab</title></svelte:head>

<div class="page">
	<nav class="breadcrumb">
		<a href="/tanya-jawab">Tanya Jawab</a>
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg
		>
		<span>Pertanyaan</span>
	</nav>

	<div class="question-card">
		<h1 class="q-title">{question.title}</h1>
		{#if question.body}<p class="q-body">{question.body}</p>{/if}

		{#if attachments.length > 0}
			<div class="q-attachments">
				{#each attachments as att (att.id)}
					{#if att.attachment_type === 'IMAGE'}
						<img
							src="/api/files/{att.drive_file.id}/stream"
							alt={att.display_name ?? att.drive_file.name}
							loading="lazy"
							class="att-img"
						/>
					{:else if att.attachment_type === 'VIDEO'}
						<video controls preload="metadata" class="att-video">
							<source src="/api/files/{att.drive_file.id}/stream" type={att.drive_file.mime_type} />
						</video>
					{:else}
						<a
							href="/api/files/{att.drive_file.id}/stream"
							target="_blank"
							rel="noopener noreferrer"
							class="att-link"
						>
							📎 {att.display_name ?? att.drive_file.name}
						</a>
					{/if}
				{/each}
			</div>
		{/if}

		<div class="q-meta">
			<span>{question.author?.full_name ?? 'Anonim'}</span>
			<span>{question.view_count} dilihat</span>
			<span>{new Date(question.created_at).toLocaleDateString('id-ID')}</span>
			{#if question.is_resolved}<span class="resolved">✓ Terjawab</span>{/if}
		</div>
	</div>

	<section class="answers-section">
		<h2 class="section-title">{answers.length} Jawaban</h2>

		{#each answers as ans (ans.id)}
			<div class="answer-card" class:verified={ans.is_verified}>
				{#if ans.is_verified}
					<div class="verified-badge">✓ Terverifikasi Admin</div>
				{/if}
				<p class="ans-body">{ans.body}</p>
				<div class="ans-meta">
					<span>{ans.author?.full_name ?? 'Anonim'}</span>
					<span>{new Date(ans.created_at).toLocaleDateString('id-ID')}</span>
				</div>
				{#if !ans.is_verified}
					<form method="POST" action="?/verify" use:enhance>
						<input type="hidden" name="answer_id" value={ans.id} />
						<button type="submit" class="btn-verify">Verifikasi Jawaban</button>
					</form>
				{/if}
			</div>
		{/each}

		<div class="answer-form-card">
			<h3 class="answer-form-title">Tulis Jawaban</h3>
			{#if form?.error}<p class="form-error">{form.error}</p>{/if}
			<form
				method="POST"
				action="?/answer"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						submitting = false;
						await update();
					};
				}}
			>
				<textarea
					name="body"
					class="ans-textarea"
					rows="4"
					placeholder="Tuliskan jawaban Anda…"
					required
				></textarea>
				<button type="submit" class="btn-submit" disabled={submitting}>
					{submitting ? 'Mengirim…' : 'Kirim Jawaban'}
				</button>
			</form>
		</div>
	</section>
</div>

<style>
	.page {
		max-width: 760px;
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
	.question-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.q-title {
		font-size: 1.375rem;
		font-weight: 700;
		margin: 0;
	}
	.q-body {
		margin: 0;
		color: var(--color-text-secondary);
		line-height: 1.65;
	}
	.q-attachments {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.att-img {
		max-width: 100%;
		border-radius: var(--radius-md);
	}
	.att-video {
		width: 100%;
		border-radius: var(--radius-md);
	}
	.att-link {
		color: var(--color-primary);
		text-decoration: underline;
		font-size: 0.875rem;
	}
	.q-meta {
		display: flex;
		gap: 0.75rem;
		font-size: 0.75rem;
		color: var(--color-muted);
		flex-wrap: wrap;
	}
	.resolved {
		font-weight: 700;
		color: color-mix(in srgb, var(--color-success) 80%, black);
	}
	.answers-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.section-title {
		font-size: 1rem;
		font-weight: 700;
		margin: 0;
	}
	.answer-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.125rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.answer-card.verified {
		border-color: color-mix(in srgb, var(--color-success) 40%, transparent);
		background: var(--color-success-bg);
	}
	.verified-badge {
		font-size: 0.75rem;
		font-weight: 700;
		color: color-mix(in srgb, var(--color-success) 80%, black);
	}
	.ans-body {
		margin: 0;
		font-size: 0.9375rem;
		line-height: 1.65;
		color: var(--color-text);
	}
	.ans-meta {
		display: flex;
		gap: 0.625rem;
		font-size: 0.75rem;
		color: var(--color-muted);
	}
	.btn-verify {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 10%, transparent);
		border: none;
		padding: 0.25rem 0.625rem;
		border-radius: var(--radius-sm);
		cursor: pointer;
	}
	.answer-form-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.125rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.answer-form-title {
		font-size: 1rem;
		font-weight: 700;
		margin: 0;
	}
	.form-error {
		color: var(--color-error);
		font-size: 0.875rem;
		margin: 0;
	}
	.ans-textarea {
		width: 100%;
		padding: 0.625rem 0.875rem;
		font-size: 0.9375rem;
		font-family: var(--font-sans);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		outline: none;
		resize: vertical;
		box-sizing: border-box;
	}
	.ans-textarea:focus {
		border-color: var(--color-primary);
	}
	.btn-submit {
		padding: 0.5rem 1.25rem;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
	}
	.btn-submit:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
