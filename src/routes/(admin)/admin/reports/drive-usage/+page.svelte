<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	const report = $derived(data.report);

	function fmt(b: number): string {
		if (b < 1024) return b + ' B';
		if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
		return (b / (1024 * 1024)).toFixed(1) + ' MB';
	}
</script>

<svelte:head><title>Penggunaan Drive — Admin ALC</title></svelte:head>
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
		> <span>Penggunaan Drive</span>
	</nav>
	<h1 class="page-title">📁 Laporan Penggunaan File Drive</h1>
	<a href="/api/reports?type=drive-usage&csv=1" class="btn-csv">⬇ Export CSV</a>

	<!-- Summary -->
	<div class="summary-cards">
		<div class="sum-card">
			<div class="sum-val">{report.total_files.toLocaleString('id-ID')}</div>
			<div class="sum-label">Total File</div>
		</div>
		<div class="sum-card">
			<div class="sum-val">{fmt(report.total_size_bytes)}</div>
			<div class="sum-label">Total Ukuran</div>
		</div>
		<div class="sum-card">
			<div class="sum-label mb">Tipe File</div>
			{#each Object.entries(report.by_type) as [type, count] (type)}
				<div class="dist-row">
					<span class="dist-label">{type}</span><span class="dist-val">{count}</span>
				</div>
			{/each}
		</div>
		<div class="sum-card">
			<div class="sum-label mb">Per Modul</div>
			{#each Object.entries(report.by_module) as [mod, count] (mod)}
				<div class="dist-row">
					<span class="dist-label">{mod}</span><span class="dist-val">{count}</span>
				</div>
			{/each}
		</div>
	</div>

	<!-- Detail table -->
	<div class="table-wrap">
		<table class="table">
			<thead
				><tr
					><th>#</th><th>Nama File</th><th>Tipe MIME</th><th>Modul</th><th>Entity</th><th
						>Pengunggah</th
					><th>Ukuran</th><th>Tanggal</th></tr
				></thead
			>
			<tbody>
				{#each report.rows as row, i (row.file_id)}
					<tr>
						<td class="num">{i + 1}</td>
						<td class="fname">{row.name}</td>
						<td class="mono">{row.mime_type}</td>
						<td>{row.storage_area}</td>
						<td class="mono">{row.entity_type}</td>
						<td>{row.uploader}</td>
						<td>{fmt(row.size_bytes ?? 0)}</td>
						<td class="date">{new Date(row.created_at).toLocaleDateString('id-ID')}</td>
					</tr>
				{/each}
				{#if report.rows.length === 0}<tr><td colspan="8" class="empty">Tidak ada file.</td></tr
					>{/if}
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
	.btn-csv {
		padding: 0.375rem 0.875rem;
		background: color-mix(in srgb, var(--color-success) 12%, transparent);
		color: color-mix(in srgb, var(--color-success) 80%, black);
		border: 1px solid color-mix(in srgb, var(--color-success) 30%, transparent);
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
		font-weight: 600;
		text-decoration: none;
		width: fit-content;
	}
	.summary-cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 1rem;
	}
	.sum-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1rem 1.125rem;
	}
	.sum-val {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-text);
	}
	.sum-label {
		font-size: 0.75rem;
		color: var(--color-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.sum-label.mb {
		margin-bottom: 0.5rem;
	}
	.dist-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.8125rem;
		margin: 0.125rem 0;
	}
	.dist-label {
		color: var(--color-text-secondary);
	}
	.dist-val {
		font-weight: 600;
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
	.fname {
		max-width: 200px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
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
	.empty {
		text-align: center;
		padding: 2rem;
		color: var(--color-muted);
		font-style: italic;
	}
</style>
