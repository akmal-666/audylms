<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let saving = $state(false);
	let selectedFiles = $state<FileList | null>(null);
	let fileNames = $derived(selectedFiles ? Array.from(selectedFiles).map((f) => f.name) : []);
</script>

<svelte:head><title>Tambah Materi — ALC Admin</title></svelte:head>

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
		<a href="/admin/growth-journey/stages/{data.stageId}">Stage</a>
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg
		>
		<span>Tambah Materi</span>
	</nav>

	<h1 class="page-title">Tambah Materi Baru</h1>

	{#if form?.error}
		<div class="alert-error">{form.error}</div>
	{/if}

	<form
		method="POST"
		enctype="multipart/form-data"
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
				<label for="title" class="form-label">Judul Materi <span class="required">*</span></label>
				<input id="title" name="title" type="text" class="form-input" required />
			</div>
			<div class="form-group span-2">
				<label for="summary" class="form-label">Ringkasan</label>
				<input id="summary" name="summary" type="text" class="form-input" />
			</div>
			<div class="form-group">
				<label for="sort_order" class="form-label">Urutan</label>
				<input
					id="sort_order"
					name="sort_order"
					type="number"
					class="form-input"
					value="0"
					min="0"
				/>
			</div>
			<div class="form-group">
				<label for="estimated_min" class="form-label">Estimasi (menit)</label>
				<input id="estimated_min" name="estimated_min" type="number" class="form-input" />
			</div>
			<div class="form-group span-2">
				<label for="rich_text" class="form-label">Konten Teks (HTML)</label>
				<textarea
					id="rich_text"
					name="rich_text"
					class="form-textarea rich-textarea"
					rows="10"
					placeholder="<h2>Judul</h2><p>Isi materi...</p>"
				></textarea>
			</div>
			<div class="form-group span-2">
				<label for="files" class="form-label">Lampiran (Google Drive)</label>
				<div class="upload-zone">
					<input
						id="files"
						name="files"
						type="file"
						multiple
						accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
						class="file-input"
						onchange={(e) => (selectedFiles = (e.target as HTMLInputElement).files)}
					/>
					<div class="upload-hint">
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							aria-hidden="true"
						>
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
							<polyline points="17 8 12 3 7 8" />
							<line x1="12" y1="3" x2="12" y2="15" />
						</svg>
						<span>Klik atau seret file</span>
						<span class="upload-hint-sub">Gambar, video, PDF — maks. 3 MB</span>
					</div>
				</div>
				{#if fileNames.length > 0}
					<ul class="file-list">
						{#each fileNames as name (name)}<li>📎 {name}</li>{/each}
					</ul>
				{/if}
			</div>
			<div class="form-group">
				<label class="checkbox-label">
					<input type="checkbox" name="is_required" checked />
					<span>Materi Wajib</span>
				</label>
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
				{saving ? 'Menyimpan…' : 'Simpan Materi'}
			</button>
			<a href="/admin/growth-journey/stages/{data.stageId}" class="btn-cancel">Batal</a>
		</div>
	</form>
</div>

<style>
	.page {
		max-width: 760px;
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
	}
	.form-input:focus,
	.form-textarea:focus {
		border-color: var(--color-primary);
	}
	.form-textarea {
		resize: vertical;
	}
	.rich-textarea {
		font-family: var(--font-mono);
		font-size: 0.8125rem;
	}
	.upload-zone {
		position: relative;
		border: 2px dashed var(--color-border);
		border-radius: var(--radius-lg);
		padding: 2rem 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.upload-zone:hover {
		border-color: var(--color-primary);
	}
	.file-input {
		position: absolute;
		inset: 0;
		opacity: 0;
		cursor: pointer;
		width: 100%;
		height: 100%;
	}
	.upload-hint {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.375rem;
		color: var(--color-muted);
		pointer-events: none;
	}
	.upload-hint-sub {
		font-size: 0.8125rem;
	}
	.file-list {
		list-style: none;
		margin: 0.375rem 0 0;
		padding: 0;
		font-size: 0.8125rem;
		color: var(--color-text-secondary);
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
