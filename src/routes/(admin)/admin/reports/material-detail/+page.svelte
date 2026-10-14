<script lang="ts">
	import type { PageData } from './$types';
	import ReportFilters from '$lib/components/admin/ReportFilters.svelte';
	let { data }: { data: PageData } = $props();
	const report = $derived(data.report);
	const STATUS_LABELS: Record<string, string> = {
		NOT_STARTED: 'Belum Mulai',
		IN_PROGRESS: 'Sedang',
		COMPLETED: 'Selesai'
	};
</script>

<svelte:head><title>Detail Materi — Admin ALC</title></svelte:head>
<div class="page">
	<nav class="breadcrumb">
		<a href="/admin/reports">Laporan</a>
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg
		> <span>Detail Materi</span>
	</nav>
	<h1 class="page-title">📖 Detail per Materi</h1>
	<ReportFilters positions={data.positions} showDepartment={false} />
	<p class="row-count">{report.length} baris</p>
	<div class="table-wrap">
		<table class="table">
			<thead
				><tr
					><th>#</th><th>Stage</th><th>Materi</th><th>Karyawan</th><th>Posisi</th><th>Status</th><th
						>Selesai</th
					></tr
				></thead
			>
			<tbody>
				{#each report as row, i (row.material_id + row.user_id)}
					<tr>
						<td class="num">{i + 1}</td>
						<td>{row.stage_title}</td>
						<td>{row.material_title}</td>
						<td>{row.full_name}</td>
						<td>{row.position ?? '—'}</td>
						<td
							><span class="status-chip status-{row.status.toLowerCase()}"
								>{STATUS_LABELS[row.status] ?? row.status}</span
							></td
						>
						<td class="date"
							>{row.completed_at ? new Date(row.completed_at).toLocaleDateString('id-ID') : '—'}</td
						>
					</tr>
				{/each}
				{#if report.length === 0}<tr><td colspan="7" class="empty">Tidak ada data.</td></tr>{/if}
			</tbody>
		</table>
	</div>
</div>

<style>
	.page {
		max-width: 1200px;
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
	.row-count {
		font-size: 0.8125rem;
		color: var(--color-muted);
		margin: 0;
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
	.num {
		color: var(--color-muted);
	}
	.date {
		white-space: nowrap;
		color: var(--color-muted);
	}
	.status-chip {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
		background: var(--color-bg-subtle);
		color: var(--color-muted);
	}
	.status-chip.status-completed {
		background: color-mix(in srgb, var(--color-success) 12%, transparent);
		color: color-mix(in srgb, var(--color-success) 80%, black);
	}
	.status-chip.status-in_progress {
		background: color-mix(in srgb, var(--color-primary) 10%, transparent);
		color: var(--color-primary);
	}
	.empty {
		text-align: center;
		padding: 2rem;
		color: var(--color-muted);
		font-style: italic;
	}
</style>
