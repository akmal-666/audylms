<script lang="ts">
	import type { PageData } from './$types';
	import ReportFilters from '$lib/components/admin/ReportFilters.svelte';
	let { data }: { data: PageData } = $props();
	const report = $derived(data.report);
</script>

<svelte:head><title>Ringkasan Growth Journey — Admin ALC</title></svelte:head>
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
		> <span>Ringkasan GJ</span>
	</nav>
	<h1 class="page-title">🌱 Ringkasan Growth Journey per Stage</h1>
	<ReportFilters showDepartment={false} showPosition={false} />
	<div class="table-wrap">
		<table class="table">
			<thead
				><tr
					><th>Stage</th><th>Judul</th><th>Terdaftar</th><th>Selesai</th><th>Tingkat Selesai</th><th
						>Rata-rata Hari</th
					></tr
				></thead
			>
			<tbody>
				{#each report as row (row.stage_id)}
					<tr>
						<td class="center">{row.sort_order}</td>
						<td>{row.stage_title}</td>
						<td class="center">{row.total_enrolled}</td>
						<td class="center">{row.total_completed}</td>
						<td>
							<div class="rate-cell">
								<div class="rate-bar">
									<div class="rate-fill" style="width:{row.completion_rate}%"></div>
								</div>
								<span>{row.completion_rate}%</span>
							</div>
						</td>
						<td class="center"
							>{row.avg_days_to_complete != null ? row.avg_days_to_complete + ' hari' : '—'}</td
						>
					</tr>
				{/each}
				{#if report.length === 0}<tr><td colspan="6" class="empty">Tidak ada data.</td></tr>{/if}
			</tbody>
		</table>
	</div>
</div>

<style>
	.page {
		max-width: 900px;
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
	.table-wrap {
		overflow-x: auto;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}
	.table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}
	thead {
		background: var(--color-bg-subtle);
	}
	th {
		padding: 0.75rem 1rem;
		text-align: left;
		font-weight: 600;
		color: var(--color-text-secondary);
		border-bottom: 1px solid var(--color-border);
	}
	td {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--color-border);
	}
	tbody tr:last-child td {
		border-bottom: none;
	}
	.center {
		text-align: center;
	}
	.rate-cell {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.rate-bar {
		width: 80px;
		height: 6px;
		background: var(--color-border);
		border-radius: 999px;
		overflow: hidden;
		flex-shrink: 0;
	}
	.rate-fill {
		height: 100%;
		background: var(--color-primary);
		border-radius: 999px;
	}
	.empty {
		text-align: center;
		padding: 2rem;
		color: var(--color-muted);
		font-style: italic;
	}
</style>
