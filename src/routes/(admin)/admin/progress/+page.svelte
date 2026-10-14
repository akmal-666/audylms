<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	const report = $derived(data.report);
	function pct(done: number, total: number): string {
		if (total === 0) return '0%';
		return Math.round((done / total) * 100) + '%';
	}
</script>

<svelte:head><title>Progress Karyawan — Admin ALC</title></svelte:head>
<div class="page">
	<h1 class="page-title">📊 Progress Karyawan</h1>
	<div class="table-wrap">
		<table class="table">
			<thead
				><tr
					><th>#</th><th>Nama</th><th>Kode</th><th>Peran</th><th>Posisi</th><th>GJ Selesai</th><th
						>Total Poin</th
					><th>Lencana</th><th>Sertifikat</th></tr
				></thead
			>
			<tbody>
				{#each report as row, i (row.user.id)}
					<tr>
						<td class="num">{i + 1}</td>
						<td><strong>{row.user.full_name}</strong></td>
						<td class="mono">{row.user.employee_code ?? '—'}</td>
						<td
							><span class="role-chip role-{row.user.role.toLowerCase()}">{row.user.role}</span></td
						>
						<td>{row.position?.label ?? '—'}</td>
						<td>
							<div class="progress-cell">
								<div class="mini-bar">
									<div
										class="mini-fill"
										style="width:{pct(row.gj_completed_stages, row.gj_total_stages)}"
									></div>
								</div>
								<span>{row.gj_completed_stages}/{row.gj_total_stages}</span>
							</div>
						</td>
						<td class="pts">{row.total_points.toLocaleString('id-ID')}</td>
						<td>{row.badge_count}</td>
						<td>{row.certificate_count}</td>
					</tr>
				{/each}
				{#if report.length === 0}<tr><td colspan="9" class="empty">Tidak ada data.</td></tr>{/if}
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
		gap: 1.5rem;
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
		white-space: nowrap;
	}
	td {
		padding: 0.75rem 1rem;
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
		font-size: 0.8125rem;
		color: var(--color-muted);
	}
	.role-chip {
		font-size: 0.75rem;
		font-weight: 700;
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
	}
	.role-chip.role-admin {
		background: color-mix(in srgb, var(--color-primary) 12%, transparent);
		color: var(--color-primary);
	}
	.role-chip.role-staff {
		background: var(--color-bg-subtle);
		color: var(--color-text-secondary);
	}
	.progress-cell {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.mini-bar {
		width: 60px;
		height: 6px;
		background: var(--color-border);
		border-radius: 999px;
		overflow: hidden;
		flex-shrink: 0;
	}
	.mini-fill {
		height: 100%;
		background: var(--color-primary);
		border-radius: 999px;
	}
	.pts {
		font-weight: 600;
		color: var(--color-highlight-dark, #e09520);
	}
	.empty {
		text-align: center;
		color: var(--color-muted);
		font-style: italic;
		padding: 2rem;
	}
</style>
