<script lang="ts">
	import type { PageData } from './$types';
	import ReportFilters from '$lib/components/admin/ReportFilters.svelte';
	let { data }: { data: PageData } = $props();
	const report = $derived(data.report);
</script>

<svelte:head><title>Ringkasan Karyawan — Admin ALC</title></svelte:head>
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
		> <span>Ringkasan Karyawan</span>
	</nav>
	<h1 class="page-title">👤 Ringkasan per Karyawan</h1>
	<ReportFilters departments={data.departments} positions={data.positions} />
	<p class="row-count">{report.length} karyawan</p>
	<div class="table-wrap">
		<table class="table">
			<thead>
				<tr
					><th>#</th><th>Nama</th><th>Kode</th><th>Posisi</th><th>Departemen</th><th>GJ Selesai</th
					><th>Materi</th><th>Kuis Lulus</th><th>Poin</th><th>Lencana</th><th>Sertifikat</th><th
						>Aktivitas Terakhir</th
					></tr
				>
			</thead>
			<tbody>
				{#each report as row, i (row.user_id)}
					<tr>
						<td class="num">{i + 1}</td>
						<td><strong>{row.full_name}</strong></td>
						<td class="mono">{row.employee_code ?? '—'}</td>
						<td>{row.position ?? '—'}</td>
						<td>{row.department ?? '—'}</td>
						<td class="center">{row.gj_stages_completed}</td>
						<td class="center">{row.gj_materials_completed}</td>
						<td class="center">{row.quizzes_passed}</td>
						<td class="pts">{row.total_points.toLocaleString('id-ID')}</td>
						<td class="center">{row.badges_earned}</td>
						<td class="center">{row.certificates}</td>
						<td class="date"
							>{row.last_activity
								? new Date(row.last_activity).toLocaleDateString('id-ID')
								: '—'}</td
						>
					</tr>
				{/each}
				{#if report.length === 0}<tr><td colspan="12" class="empty">Tidak ada data.</td></tr>{/if}
			</tbody>
		</table>
	</div>
</div>

<style>
	.page {
		max-width: 1400px;
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
		white-space: nowrap;
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
	.mono {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--color-muted);
	}
	.center {
		text-align: center;
	}
	.pts {
		font-weight: 700;
		color: var(--color-highlight-dark, #e09520);
	}
	.date {
		white-space: nowrap;
		color: var(--color-muted);
	}
	.empty {
		text-align: center;
		padding: 2rem;
		color: var(--color-muted);
		font-style: italic;
	}
</style>
