<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const stage = $derived(data.stage);
	const materials = $derived(data.materials);
	let saving = $state(false);
</script>

<svelte:head><title>{stage.title} — Admin ALC</title></svelte:head>

<div class="page">
	<nav class="breadcrumb">
		<a href="/admin/growth-journey">Growth Journey</a>
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg
		>
		<span>Edit Stage</span>
	</nav>

	<div class="page-header">
		<h1 class="page-title">Edit: {stage.title}</h1>
		<a href="/admin/growth-journey/stages/{stage.id}/materials/new" class="btn-primary"
			>+ Tambah Materi</a
		>
	</div>

	{#if form?.saved}
		<div class="alert-success">Stage berhasil disimpan.</div>
	{/if}
	{#if form?.error}
		<div class="alert-error">{form.error}</div>
	{/if}

	<form
		method="POST"
		action="?/updateStage"
		class="form-card"
		use:enhance={() => {
			saving = true;
			return async ({ update }) => {
				saving = false;
				await update();
			};
		}}
	>
		<div class="form-grid">
			<div class="form-group span-2">
				<label for="title" class="form-label">Judul *</label>
				<input
					id="title"
					name="title"
					type="text"
					class="form-input"
					value={stage.title}
					required
				/>
			</div>
			<div class="form-group span-2">
				<label for="description" class="form-label">Deskripsi</label>
				<textarea id="description" name="description" class="form-textarea" rows="3"
					>{stage.description ?? ''}</textarea
				>
			</div>
			<div class="form-group">
				<label for="icon" class="form-label">Ikon</label>
				<input id="icon" name="icon" type="text" class="form-input" value={stage.icon ?? ''} />
			</div>
			<div class="form-group">
				<label for="sort_order" class="form-label">Urutan</label>
				<input
					id="sort_order"
					name="sort_order"
					type="number"
					class="form-input"
					value={stage.sort_order}
				/>
			</div>
			<div class="form-group">
				<label for="estimated_min" class="form-label">Estimasi (menit)</label>
				<input
					id="estimated_min"
					name="estimated_min"
					type="number"
					class="form-input"
					value={stage.estimated_min ?? ''}
				/>
			</div>
			<div class="form-group">
				<label for="points_reward" class="form-label">Poin Reward</label>
				<input
					id="points_reward"
					name="points_reward"
					type="number"
					class="form-input"
					value={stage.points_reward}
				/>
			</div>
			<div class="form-group span-2">
				<label for="position_filter" class="form-label">Filter Posisi</label>
				<input
					id="position_filter"
					name="position_filter"
					type="text"
					class="form-input"
					value={stage.position_filter?.join(', ') ?? ''}
				/>
			</div>
			<div class="form-group">
				<label class="checkbox-label">
					<input type="checkbox" name="is_published" checked={stage.is_published} />
					<span>Terbitkan</span>
				</label>
			</div>
		</div>
		<div class="form-actions">
			<button type="submit" class="btn-primary" disabled={saving}
				>{saving ? 'Menyimpan…' : 'Simpan Perubahan'}</button
			>
		</div>
	</form>

	<section class="materials-section">
		<div class="section-header">
			<h2 class="section-title">Materi ({materials.length})</h2>
			<a href="/admin/growth-journey/stages/{stage.id}/materials/new" class="btn-sm">+ Tambah</a>
		</div>
		{#if materials.length === 0}
			<p class="empty">Belum ada materi.</p>
		{:else}
			<ul class="mat-list">
				{#each materials as mat, i (mat.id)}
					<li class="mat-row">
						<span class="mat-num">{i + 1}</span>
						<div class="mat-info">
							<span class="mat-title">{mat.title}</span>
							{#if mat.summary}<p class="mat-summary">{mat.summary}</p>{/if}
						</div>
						<span class="status-chip" class:published={mat.is_published}>
							{mat.is_published ? 'Aktif' : 'Draft'}
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>

<style>
	.page {
		max-width: 800px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
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
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.page-title {
		font-size: 1.375rem;
		font-weight: 700;
		margin: 0;
	}
	.btn-primary {
		display: inline-flex;
		padding: 0.5rem 1.125rem;
		background: var(--color-primary);
		color: white;
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		font-weight: 600;
		text-decoration: none;
		border: none;
		cursor: pointer;
	}
	.btn-primary:hover:not(:disabled) {
		background: var(--color-primary-light);
	}
	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.alert-success {
		padding: 0.75rem 1rem;
		background: var(--color-success-bg);
		color: color-mix(in srgb, var(--color-success) 80%, black);
		border-radius: var(--radius-md);
		font-size: 0.875rem;
	}
	.alert-error {
		padding: 0.75rem 1rem;
		background: var(--color-error-bg);
		color: var(--color-error);
		border-radius: var(--radius-md);
		font-size: 0.875rem;
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
	}
	.form-actions {
		padding-top: 0.25rem;
	}
	.materials-section {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
		padding: 1.25rem;
	}
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}
	.section-title {
		font-size: 1.0625rem;
		font-weight: 700;
		margin: 0;
	}
	.btn-sm {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 10%, transparent);
		padding: 0.25rem 0.75rem;
		border-radius: var(--radius-sm);
		text-decoration: none;
	}
	.empty {
		color: var(--color-muted);
		font-style: italic;
	}
	.mat-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
	}
	.mat-row {
		display: flex;
		align-items: flex-start;
		gap: 0.875rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--color-border);
	}
	.mat-row:last-child {
		border-bottom: none;
	}
	.mat-num {
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: var(--color-bg-subtle);
		color: var(--color-muted);
		font-size: 0.8rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.mat-info {
		flex: 1;
		min-width: 0;
	}
	.mat-title {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-text);
	}
	.mat-summary {
		font-size: 0.8rem;
		color: var(--color-muted);
		margin: 0.125rem 0 0;
	}
	.status-chip {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
		background: var(--color-bg-subtle);
		color: var(--color-muted);
		flex-shrink: 0;
	}
	.status-chip.published {
		background: color-mix(in srgb, var(--color-success) 15%, transparent);
		color: color-mix(in srgb, var(--color-success) 80%, black);
	}
</style>
