<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
	const files = $derived(data.files);
	const total = $derived(data.total);

	let replaceTarget = $state<string | null>(null);
	let deleting = $state<string | null>(null);

	const STORAGE_LABELS: Record<string, string> = {
		'growth-journey': 'Growth Journey',
		'product-knowledge': 'Product Knowledge',
		'play-learn': 'Play & Learn',
		'lets-practice': 'Lets Practice',
		'fresh-update': 'Fresh Update',
		qna: 'Tanya Jawab',
		system: 'System'
	};

	function formatBytes(bytes: number | null): string {
		if (!bytes) return '—';
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
</script>

<svelte:head><title>File Manager — Admin ALC</title></svelte:head>

<div class="page">
	<div class="page-header">
		<div>
			<h1 class="page-title">📁 File Manager</h1>
			<p class="page-subtitle">{total} file di Google Drive</p>
		</div>
		<form method="GET" class="search-form">
			<input
				name="q"
				type="search"
				class="search-input"
				placeholder="Cari nama file…"
				value={data.search ?? ''}
			/>
			<button type="submit" class="btn-search">Cari</button>
		</form>
	</div>

	{#if form?.error}<div class="alert-error">{form.error}</div>{/if}
	{#if form?.deleted}<div class="alert-success">File berhasil dihapus / dicabut asosiasi.</div>{/if}
	{#if form?.replaced}<div class="alert-success">File berhasil diganti.</div>{/if}

	<div class="table-wrap">
		<table class="table">
			<thead>
				<tr>
					<th>Nama</th><th>Tipe</th><th>Ukuran</th><th>Modul</th>
					<th>Entity</th><th>Diunggah oleh</th><th>Tanggal</th>
					<th>Ref</th><th>Aksi</th>
				</tr>
			</thead>
			<tbody>
				{#each files as f (f.id)}
					<tr>
						<td class="file-name">
							<span class="fname">{f.name}</span>
							<span class="fmime">{f.mime_type}</span>
						</td>
						<td class="mono">{f.entity_type}</td>
						<td>{formatBytes(f.size_bytes)}</td>
						<td>{STORAGE_LABELS[f.storage_area] ?? f.storage_area}</td>
						<td class="mono">{f.entity_id ? f.entity_id.slice(0, 8) + '…' : '—'}</td>
						<td>{f.uploader?.full_name ?? '—'}</td>
						<td class="date">{new Date(f.created_at).toLocaleDateString('id-ID')}</td>
						<td class="ref-count" class:has-refs={f.reference_count > 0}>{f.reference_count}</td>
						<td class="actions-cell">
							{#if f.web_view_url}
								<a
									href={f.web_view_url}
									target="_blank"
									rel="noopener noreferrer"
									class="action-btn">Buka</a
								>
							{/if}
							<a
								href="/api/files/{f.id}/stream"
								target="_blank"
								rel="noopener noreferrer"
								class="action-btn">Unduh</a
							>
							<button
								type="button"
								class="action-btn replace-btn"
								onclick={() => (replaceTarget = f.id)}>Ganti</button
							>
							<form
								method="POST"
								action="?/delete"
								use:enhance={() => {
									deleting = f.id;
									return async ({ update }) => {
										deleting = null;
										await update();
									};
								}}
							>
								<input type="hidden" name="file_id" value={f.id} />
								<button type="submit" class="action-btn delete-btn" disabled={deleting === f.id}
									>Hapus</button
								>
							</form>
						</td>
					</tr>
					{#if replaceTarget === f.id}
						<tr class="replace-row">
							<td colspan="9">
								<form
									method="POST"
									action="?/replace"
									enctype="multipart/form-data"
									class="replace-form"
									use:enhance
								>
									<input type="hidden" name="old_file_id" value={f.id} />
									<span>Ganti <strong>{f.name}</strong> dengan:</span>
									<input type="file" name="file" required class="file-input" />
									<button type="submit" class="btn-confirm">Upload & Ganti</button>
									<button type="button" class="btn-cancel" onclick={() => (replaceTarget = null)}
										>Batal</button
									>
								</form>
							</td>
						</tr>
					{/if}
				{/each}
				{#if files.length === 0}
					<tr><td colspan="9" class="empty">Tidak ada file yang ditemukan.</td></tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>

<style>
	.page {
		max-width: 1300px;
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
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0;
	}
	.page-subtitle {
		color: var(--color-muted);
		margin: 0.25rem 0 0;
		font-size: 0.875rem;
	}
	.search-form {
		display: flex;
		gap: 0.5rem;
	}
	.search-input {
		padding: 0.5rem 0.875rem;
		font-size: 0.875rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		outline: none;
		min-width: 220px;
	}
	.search-input:focus {
		border-color: var(--color-primary);
	}
	.btn-search {
		padding: 0.5rem 1rem;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		cursor: pointer;
	}
	.alert-error {
		padding: 0.75rem 1rem;
		background: var(--color-error-bg);
		color: var(--color-error);
		border-radius: var(--radius-md);
		font-size: 0.875rem;
	}
	.alert-success {
		padding: 0.75rem 1rem;
		background: var(--color-success-bg);
		color: color-mix(in srgb, var(--color-success) 80%, black);
		border-radius: var(--radius-md);
		font-size: 0.875rem;
	}
	.table-wrap {
		overflow-x: auto;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}
	.table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.8125rem;
	}
	thead {
		background: var(--color-bg-subtle);
	}
	th {
		padding: 0.625rem 0.875rem;
		text-align: left;
		font-weight: 600;
		color: var(--color-text-secondary);
		border-bottom: 1px solid var(--color-border);
		white-space: nowrap;
	}
	td {
		padding: 0.625rem 0.875rem;
		border-bottom: 1px solid var(--color-border);
		color: var(--color-text);
		vertical-align: middle;
	}
	tbody tr:last-child td {
		border-bottom: none;
	}
	.file-name {
		max-width: 200px;
	}
	.fname {
		display: block;
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.fmime {
		display: block;
		font-size: 0.75rem;
		color: var(--color-muted);
		font-family: var(--font-mono);
	}
	.mono {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--color-muted);
	}
	.date {
		white-space: nowrap;
		color: var(--color-muted);
	}
	.ref-count {
		text-align: center;
		font-weight: 700;
		color: var(--color-muted);
	}
	.ref-count.has-refs {
		color: var(--color-primary);
	}
	.actions-cell {
		display: flex;
		gap: 0.375rem;
		flex-wrap: wrap;
		align-items: center;
	}
	.action-btn {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.125rem 0.5rem;
		border-radius: var(--radius-sm);
		cursor: pointer;
		background: var(--color-bg-subtle);
		border: 1px solid var(--color-border);
		color: var(--color-text-secondary);
		text-decoration: none;
	}
	.action-btn:hover {
		background: color-mix(in srgb, var(--color-primary) 8%, transparent);
		color: var(--color-primary);
		border-color: var(--color-primary);
	}
	.replace-btn {
		background: color-mix(in srgb, var(--color-warning) 10%, transparent);
		color: var(--color-warning);
		border-color: var(--color-warning);
	}
	.delete-btn {
		background: color-mix(in srgb, var(--color-error) 10%, transparent);
		color: var(--color-error);
		border-color: var(--color-error);
	}
	.delete-btn:disabled {
		opacity: 0.5;
	}
	.replace-row {
		background: color-mix(in srgb, var(--color-warning) 5%, transparent);
	}
	.replace-form {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		padding: 0.25rem 0.875rem;
		flex-wrap: wrap;
	}
	.file-input {
		font-size: 0.8125rem;
	}
	.btn-confirm {
		padding: 0.375rem 0.875rem;
		background: var(--color-warning);
		color: white;
		border: none;
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
		cursor: pointer;
	}
	.btn-cancel {
		padding: 0.375rem 0.875rem;
		background: none;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
		cursor: pointer;
		color: var(--color-muted);
	}
	.empty {
		text-align: center;
		color: var(--color-muted);
		font-style: italic;
		padding: 2rem;
	}
</style>
