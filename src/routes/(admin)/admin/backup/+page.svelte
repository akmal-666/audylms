<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import type { Tables } from '$lib/types/database.types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const jobs = $derived(data.jobs as Tables<'backup_jobs'>[]);

	let backing = $state(false);
	let validating = $state(false);

	const STATUS_ICON: Record<string, string> = {
		PENDING: '⏳',
		RUNNING: '🔄',
		COMPLETED: '✅',
		FAILED: '❌',
		RESTORED: '♻️'
	};
	const STATUS_LABEL: Record<string, string> = {
		PENDING: 'Menunggu',
		RUNNING: 'Berjalan',
		COMPLETED: 'Selesai',
		FAILED: 'Gagal',
		RESTORED: 'Dipulihkan'
	};

	function fmt(b: number | null): string {
		if (!b) return '—';
		if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
		return (b / (1024 * 1024)).toFixed(1) + ' MB';
	}
</script>

<svelte:head><title>Backup — Admin ALC</title></svelte:head>

<div class="page">
	<h1 class="page-title">💾 Backup & Validasi</h1>
	<p class="page-desc">
		Backup menyimpan metadata database dan referensi Drive ke file JSON. Binary file tetap di Google
		Drive.
	</p>

	{#if form?.error}<div class="alert-error">{form.error}</div>{/if}

	<!-- Actions -->
	<div class="action-cards">
		<div class="action-card">
			<div class="action-icon">📦</div>
			<div class="action-info">
				<span class="action-title">Buat Backup</span>
				<span class="action-desc"
					>Ekspor semua metadata dan referensi Drive ke JSON, simpan di 99 - System/Backups.</span
				>
			</div>
			<form
				method="POST"
				action="?/backup"
				use:enhance={() => {
					backing = true;
					return async ({ update }) => {
						backing = false;
						await update();
					};
				}}
			>
				<button type="submit" class="btn-action" disabled={backing}
					>{backing ? 'Memproses…' : 'Mulai Backup'}</button
				>
			</form>
		</div>

		<div class="action-card">
			<div class="action-icon">🔍</div>
			<div class="action-info">
				<span class="action-title">Validasi File Drive</span>
				<span class="action-desc"
					>Periksa apakah semua Drive file ID di database masih ada. File yang hilang ditandai
					MISSING.</span
				>
			</div>
			<form
				method="POST"
				action="?/validate"
				use:enhance={() => {
					validating = true;
					return async ({ update }) => {
						validating = false;
						await update();
					};
				}}
			>
				<button type="submit" class="btn-action btn-validate" disabled={validating}
					>{validating ? 'Memvalidasi…' : 'Validasi Drive'}</button
				>
			</form>
		</div>
	</div>

	<!-- Validation result -->
	{#if form?.validation}
		{@const v = form.validation}
		<div class="validation-result" class:has-missing={v.missing.length > 0}>
			<h2 class="val-title">
				{v.missing.length === 0 ? '✅ Semua File Valid' : `⚠️ ${v.missing.length} File Hilang`}
			</h2>
			<div class="val-stats">
				<span>Total: {v.total_drive_files}</span>
				<span>Ditemukan: {v.found}</span>
				<span>Hilang: {v.missing.length} ({v.missing_percentage}%)</span>
			</div>
			{#if v.missing.length > 0}
				<details class="missing-list">
					<summary>Lihat file yang hilang ({v.missing.length})</summary>
					<ul>
						{#each v.missing as id (id)}<li class="mono">{id}</li>{/each}
					</ul>
				</details>
			{/if}
		</div>
	{/if}

	<!-- Backup history -->
	<section class="history-section">
		<h2 class="section-title">Riwayat Backup</h2>
		{#if jobs.length === 0}
			<p class="empty">Belum ada backup.</p>
		{:else}
			<div class="table-wrap">
				<table class="table">
					<thead
						><tr
							><th>Status</th><th>Tipe</th><th>File</th><th>Records</th><th>Ukuran</th><th
								>Waktu Mulai</th
							><th>Selesai</th></tr
						></thead
					>
					<tbody>
						{#each jobs as job (job.id)}
							<tr>
								<td
									><span class="status-chip"
										>{STATUS_ICON[job.status]} {STATUS_LABEL[job.status]}</span
									></td
								>
								<td>{job.backup_type}</td>
								<td class="center">{job.drive_file_ids_count ?? '—'}</td>
								<td class="mono"
									>{job.record_counts
										? JSON.stringify(
												Object.entries(job.record_counts as Record<string, number>)
													.map(([k, v]) => `${k}:${v}`)
													.slice(0, 3)
													.join(', ') + '…'
											)
										: '—'}</td
								>
								<td>{fmt(job.local_size_bytes)}</td>
								<td class="date"
									>{job.started_at ? new Date(job.started_at).toLocaleString('id-ID') : '—'}</td
								>
								<td class="date"
									>{job.completed_at ? new Date(job.completed_at).toLocaleString('id-ID') : '—'}</td
								>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</div>

<style>
	.page {
		max-width: 1000px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.page-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0;
	}
	.page-desc {
		color: var(--color-muted);
		margin: 0;
		font-size: 0.9375rem;
	}
	.alert-error {
		padding: 0.75rem 1rem;
		background: var(--color-error-bg);
		color: var(--color-error);
		border-radius: var(--radius-md);
		font-size: 0.875rem;
	}
	.action-cards {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}
	@media (max-width: 640px) {
		.action-cards {
			grid-template-columns: 1fr;
		}
	}
	.action-card {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
		padding: 1.375rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
	}
	.action-icon {
		font-size: 2rem;
	}
	.action-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
	}
	.action-title {
		font-size: 1.0625rem;
		font-weight: 700;
		color: var(--color-text);
	}
	.action-desc {
		font-size: 0.8125rem;
		color: var(--color-muted);
		line-height: 1.5;
	}
	.btn-action {
		padding: 0.625rem 1.25rem;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		width: fit-content;
	}
	.btn-action:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.btn-validate {
		background: var(--color-info);
	}
	.validation-result {
		padding: 1.25rem;
		background: var(--color-surface);
		border: 2px solid color-mix(in srgb, var(--color-success) 40%, transparent);
		border-radius: var(--radius-xl);
	}
	.validation-result.has-missing {
		border-color: color-mix(in srgb, var(--color-warning) 50%, transparent);
		background: var(--color-warning-bg);
	}
	.val-title {
		font-size: 1.0625rem;
		font-weight: 700;
		margin: 0 0 0.5rem;
	}
	.val-stats {
		display: flex;
		gap: 1rem;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}
	.missing-list {
		margin-top: 0.75rem;
	}
	.missing-list summary {
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-warning);
	}
	.missing-list ul {
		margin: 0.5rem 0 0 1rem;
		font-size: 0.8125rem;
	}
	.history-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.section-title {
		font-size: 1rem;
		font-weight: 700;
		margin: 0;
	}
	.empty {
		color: var(--color-muted);
		font-style: italic;
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
	}
	td {
		padding: 0.625rem 0.875rem;
		border-bottom: 1px solid var(--color-border);
	}
	tbody tr:last-child td {
		border-bottom: none;
	}
	.center {
		text-align: center;
	}
	.mono {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--color-muted);
		max-width: 250px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.date {
		white-space: nowrap;
		font-size: 0.75rem;
		color: var(--color-muted);
	}
	.status-chip {
		font-size: 0.8125rem;
		font-weight: 600;
	}
</style>
