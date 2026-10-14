<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import type { Tables } from '$lib/types/database.types';

	// Explicit type to avoid PageData inference collapsing joined objects
	type QnaListItem = Tables<'qna_questions'> & {
		author: Pick<Tables<'profiles'>, 'id' | 'full_name'> | null;
		answer_count: number;
	};

	let { data, form }: { data: { questions: QnaListItem[]; total: number }; form: ActionData } =
		$props();

	const questions = $derived(data.questions);
	let showAsk = $state(false);
	let submitting = $state(false);
</script>

<svelte:head><title>Tanya Jawab — ALC</title></svelte:head>
<div class="page">
	<header class="page-header">
		<div>
			<h1 class="page-title">💬 Tanya Jawab</h1>
			<p class="page-subtitle">Ajukan pertanyaan dan dapatkan jawaban dari tim.</p>
		</div>
		<button class="btn-ask" onclick={() => (showAsk = !showAsk)}>+ Ajukan Pertanyaan</button>
	</header>

	{#if showAsk}
		<div class="ask-card">
			<h2 class="ask-title">Ajukan Pertanyaan</h2>
			{#if form?.error}<p class="ask-error">{form.error}</p>{/if}
			<form
				method="POST"
				action="?/ask"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						submitting = false;
						showAsk = false;
						await update();
					};
				}}
			>
				<div class="form-group">
					<label for="qtitle" class="form-label">Judul *</label>
					<input
						id="qtitle"
						name="title"
						type="text"
						class="form-input"
						placeholder="Pertanyaan singkat Anda…"
						required
					/>
				</div>
				<div class="form-group">
					<label for="qbody" class="form-label">Detail (opsional)</label>
					<textarea
						id="qbody"
						name="body"
						class="form-textarea"
						rows="4"
						placeholder="Jelaskan lebih detail…"
					></textarea>
				</div>
				<div class="form-actions">
					<button type="submit" class="btn-submit" disabled={submitting}
						>{submitting ? 'Mengirim…' : 'Kirim Pertanyaan'}</button
					>
					<button type="button" class="btn-cancel" onclick={() => (showAsk = false)}>Batal</button>
				</div>
			</form>
		</div>
	{/if}

	{#if questions.length === 0}
		<p class="empty">Belum ada pertanyaan. Jadilah yang pertama!</p>
	{:else}
		<ul class="q-list">
			{#each questions as q (q.id)}
				<li class="q-item">
					<a href="/tanya-jawab/{q.id}" class="q-title">{q.title}</a>
					<div class="q-meta">
						<span>{q.author?.full_name ?? 'Anonim'}</span>
						<span>{q.answer_count} jawaban</span>
						<span>{q.view_count} dilihat</span>
						{#if q.is_resolved}<span class="resolved-chip">✓ Terjawab</span>{/if}
						<span>{new Date(q.created_at).toLocaleDateString('id-ID')}</span>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.page {
		max-width: 800px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		flex-wrap: wrap;
		gap: 1rem;
	}
	.page-title {
		font-size: 1.75rem;
		font-weight: 700;
		margin: 0;
	}
	.page-subtitle {
		color: var(--color-muted);
		margin: 0.25rem 0 0;
	}
	.btn-ask {
		padding: 0.5rem 1.125rem;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
	}
	.ask-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.ask-title {
		font-size: 1.125rem;
		font-weight: 700;
		margin: 0;
	}
	.ask-error {
		color: var(--color-error);
		font-size: 0.875rem;
		margin: 0;
	}
	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.form-label {
		font-size: 0.875rem;
		font-weight: 500;
	}
	.form-input,
	.form-textarea {
		padding: 0.625rem 0.875rem;
		font-size: 0.9375rem;
		font-family: var(--font-sans);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-text);
		outline: none;
	}
	.form-input:focus,
	.form-textarea:focus {
		border-color: var(--color-primary);
	}
	.form-textarea {
		resize: vertical;
		min-height: 90px;
	}
	.form-actions {
		display: flex;
		gap: 1rem;
		align-items: center;
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
	.btn-cancel {
		font-size: 0.875rem;
		color: var(--color-muted);
		background: none;
		border: none;
		cursor: pointer;
	}
	.empty {
		color: var(--color-muted);
		font-style: italic;
	}
	.q-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}
	.q-item {
		padding: 0.875rem 1.125rem;
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface);
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.q-item:last-child {
		border-bottom: none;
	}
	.q-title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: none;
	}
	.q-title:hover {
		text-decoration: underline;
	}
	.q-meta {
		display: flex;
		gap: 0.75rem;
		font-size: 0.75rem;
		color: var(--color-muted);
		flex-wrap: wrap;
	}
	.resolved-chip {
		font-weight: 600;
		color: color-mix(in srgb, var(--color-success) 80%, black);
		background: color-mix(in srgb, var(--color-success) 12%, transparent);
		padding: 0 0.375rem;
		border-radius: 999px;
	}
</style>
