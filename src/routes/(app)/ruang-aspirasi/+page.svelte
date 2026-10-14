<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
	const mine = $derived(data.mine);
	let submitting = $state(false);
	const CATEGORY_LABELS: Record<string, string> = {
		SARAN: 'Saran',
		KELUHAN: 'Keluhan',
		IDE: 'Ide',
		APRESIASI: 'Apresiasi',
		LAINNYA: 'Lainnya'
	};
	const STATUS_LABELS: Record<string, string> = {
		SUBMITTED: 'Dikirim',
		REVIEWED: 'Ditinjau',
		IN_PROGRESS: 'Diproses',
		RESOLVED: 'Selesai',
		DISMISSED: 'Ditutup'
	};
</script>

<svelte:head><title>Ruang Aspirasi — ALC</title></svelte:head>
<div class="page">
	<header class="page-header">
		<h1 class="page-title">💭 Ruang Aspirasi</h1>
		<p class="page-subtitle">Sampaikan saran, ide, atau keluhan Anda.</p>
	</header>

	{#if form?.submitted}
		<div class="success-banner">✓ Aspirasi Anda telah diterima. Terima kasih!</div>
	{/if}

	<div class="form-card">
		<h2 class="form-title">Kirim Aspirasi</h2>
		{#if form?.error}<p class="form-error">{form.error}</p>{/if}
		<form
			method="POST"
			action="?/submit"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					submitting = false;
					await update();
				};
			}}
		>
			<div class="form-grid">
				<div class="form-group span-2">
					<label for="asp-title" class="form-label">Judul *</label>
					<input
						id="asp-title"
						name="title"
						type="text"
						class="form-input"
						required
						placeholder="Ringkasan aspirasi…"
					/>
				</div>
				<div class="form-group">
					<label for="asp-cat" class="form-label">Kategori</label>
					<select id="asp-cat" name="category" class="form-input">
						{#each Object.entries(CATEGORY_LABELS) as [val, label] (val)}
							<option value={val}>{label}</option>
						{/each}
					</select>
				</div>
				<div class="form-group">
					<label class="checkbox-label">
						<input type="checkbox" name="is_anonymous" />
						<span>Kirim secara anonim</span>
					</label>
				</div>
				<div class="form-group span-2">
					<label for="asp-body" class="form-label">Detail *</label>
					<textarea
						id="asp-body"
						name="body"
						class="form-textarea"
						rows="5"
						required
						placeholder="Sampaikan aspirasi Anda dengan jelas…"
					></textarea>
				</div>
			</div>
			<button type="submit" class="btn-submit" disabled={submitting}
				>{submitting ? 'Mengirim…' : 'Kirim Aspirasi'}</button
			>
		</form>
	</div>

	{#if mine.length > 0}
		<section class="my-section">
			<h2 class="section-title">Aspirasi Saya</h2>
			<ul class="asp-list">
				{#each mine as asp (asp.id)}
					<li class="asp-item">
						<div class="asp-header">
							<span class="asp-title">{asp.title}</span>
							<span class="asp-status status-{asp.status.toLowerCase()}"
								>{STATUS_LABELS[asp.status]}</span
							>
						</div>
						<div class="asp-meta">
							<span>{CATEGORY_LABELS[asp.category]}</span>
							<span>{new Date(asp.created_at).toLocaleDateString('id-ID')}</span>
						</div>
						{#if asp.admin_response}
							<div class="asp-response">
								<span class="response-label">Respons Admin:</span>
								<p class="response-body">{asp.admin_response}</p>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
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
	.page-title {
		font-size: 1.75rem;
		font-weight: 700;
		margin: 0;
	}
	.page-subtitle {
		color: var(--color-muted);
		margin: 0.25rem 0 0;
	}
	.success-banner {
		padding: 0.75rem 1rem;
		background: var(--color-success-bg);
		color: color-mix(in srgb, var(--color-success) 80%, black);
		border-radius: var(--radius-md);
		font-weight: 600;
	}
	.form-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.form-title {
		font-size: 1.125rem;
		font-weight: 700;
		margin: 0;
	}
	.form-error {
		color: var(--color-error);
		font-size: 0.875rem;
		margin: 0;
	}
	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}
	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.form-group.span-2 {
		grid-column: span 2;
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
	}
	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		cursor: pointer;
		margin-top: 1.5rem;
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
	}
	.btn-submit:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.my-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.section-title {
		font-size: 1rem;
		font-weight: 700;
		margin: 0;
	}
	.asp-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.asp-item {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1rem 1.125rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.asp-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.5rem;
	}
	.asp-title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-text);
	}
	.asp-status {
		font-size: 0.75rem;
		font-weight: 700;
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
		background: var(--color-bg-subtle);
		color: var(--color-muted);
		flex-shrink: 0;
	}
	.asp-status.status-resolved {
		background: color-mix(in srgb, var(--color-success) 12%, transparent);
		color: color-mix(in srgb, var(--color-success) 80%, black);
	}
	.asp-status.status-in_progress {
		background: color-mix(in srgb, var(--color-primary) 10%, transparent);
		color: var(--color-primary);
	}
	.asp-meta {
		display: flex;
		gap: 0.625rem;
		font-size: 0.75rem;
		color: var(--color-muted);
	}
	.asp-response {
		background: color-mix(in srgb, var(--color-info) 8%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-info) 25%, transparent);
		border-radius: var(--radius-md);
		padding: 0.625rem 0.875rem;
	}
	.response-label {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--color-info);
	}
	.response-body {
		margin: 0.25rem 0 0;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}
</style>
