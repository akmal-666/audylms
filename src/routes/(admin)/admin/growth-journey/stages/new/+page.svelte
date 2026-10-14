<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let saving = $state(false);
</script>

<svelte:head><title>Tambah Stage — ALC Admin</title></svelte:head>

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
		<span>Tambah Stage</span>
	</nav>

	<h1 class="page-title">Tambah Stage Baru</h1>

	{#if form?.error}
		<div class="alert-error">{form.error}</div>
	{/if}

	<form
		method="POST"
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
				<label for="title" class="form-label">Judul <span class="required">*</span></label>
				<input
					id="title"
					name="title"
					type="text"
					class="form-input"
					placeholder="contoh: Start Your Journey 😍"
					required
				/>
			</div>

			<div class="form-group span-2">
				<label for="description" class="form-label">Deskripsi</label>
				<textarea
					id="description"
					name="description"
					class="form-textarea"
					rows="3"
					placeholder="Penjelasan singkat tentang stage ini…"
				></textarea>
			</div>

			<div class="form-group">
				<label for="icon" class="form-label">Ikon (emoji)</label>
				<input id="icon" name="icon" type="text" class="form-input" placeholder="🌱" />
			</div>

			<div class="form-group">
				<label for="sort_order" class="form-label">Urutan</label>
				<input
					id="sort_order"
					name="sort_order"
					type="number"
					class="form-input"
					value={data.nextOrder}
					min="1"
				/>
			</div>

			<div class="form-group">
				<label for="estimated_min" class="form-label">Estimasi Waktu (menit)</label>
				<input
					id="estimated_min"
					name="estimated_min"
					type="number"
					class="form-input"
					placeholder="30"
					min="1"
				/>
			</div>

			<div class="form-group">
				<label for="points_reward" class="form-label">Poin Reward</label>
				<input
					id="points_reward"
					name="points_reward"
					type="number"
					class="form-input"
					value="0"
					min="0"
				/>
			</div>

			<div class="form-group span-2">
				<label for="position_filter" class="form-label">Filter Posisi (kosongkan = semua)</label>
				<input
					id="position_filter"
					name="position_filter"
					type="text"
					class="form-input"
					placeholder="RESEPSIONIS, PERAWAT_GIGI, SUPERVISOR"
				/>
				<span class="form-hint">Pisahkan dengan koma. Kosongkan untuk semua posisi.</span>
			</div>

			<div class="form-group">
				<label class="checkbox-label">
					<input type="checkbox" name="is_published" />
					<span>Terbitkan sekarang</span>
				</label>
			</div>
		</div>

		<div class="form-actions">
			<button type="submit" class="btn-primary" disabled={saving}>
				{saving ? 'Menyimpan…' : 'Simpan Stage'}
			</button>
			<a href="/admin/growth-journey" class="btn-cancel">Batal</a>
		</div>
	</form>
</div>

<style>
	.page {
		max-width: 700px;
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
	.page-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0;
	}
	.alert-error {
		padding: 0.75rem 1rem;
		background: var(--color-error-bg);
		color: var(--color-error);
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		border: 1px solid color-mix(in srgb, var(--color-error) 25%, transparent);
	}
	.form-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
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
		color: var(--color-text);
	}
	.required {
		color: var(--color-error);
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
		transition: border-color 0.15s;
	}
	.form-input:focus,
	.form-textarea:focus {
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 12%, transparent);
	}
	.form-textarea {
		resize: vertical;
		min-height: 80px;
	}
	.form-hint {
		font-size: 0.75rem;
		color: var(--color-muted);
	}
	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		cursor: pointer;
	}
	.form-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding-top: 0.25rem;
	}
	.btn-primary {
		padding: 0.625rem 1.5rem;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-md);
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
	}
	.btn-primary:hover:not(:disabled) {
		background: var(--color-primary-light);
	}
	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.btn-cancel {
		font-size: 0.875rem;
		color: var(--color-muted);
		text-decoration: none;
	}
</style>
