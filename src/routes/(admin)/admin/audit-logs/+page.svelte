<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	const logs = $derived(data.logs);
</script>

<svelte:head><title>Audit Log — Admin ALC</title></svelte:head>
<div class="page">
	<div class="page-header">
		<div>
			<h1 class="page-title">📋 Audit Log</h1>
			<p class="page-subtitle">{data.total} total entri</p>
		</div>
		<a href="/api/reports?type=audit-logs&csv=1" class="btn-csv">⬇ CSV</a>
	</div>

	<form method="GET" class="filter-bar">
		<input
			name="action"
			type="text"
			class="filter-input"
			placeholder="Filter aksi (mis. FILE_UPLOADED)"
			value={data.action ?? ''}
		/>
		<button type="submit" class="btn-filter">Terapkan</button>
		{#if data.action}<a href="?" class="btn-clear">Hapus Filter</a>{/if}
	</form>

	<div class="table-wrap">
		<table class="table">
			<thead
				><tr><th>Waktu</th><th>Aksi</th><th>Tabel</th><th>Record ID</th><th>User</th><th>IP</th></tr
				></thead
			>
			<tbody>
				{#each logs as log (log.id)}
					<tr>
						<td class="date">{new Date(log.created_at).toLocaleString('id-ID')}</td>
						<td><code class="action-code">{log.action}</code></td>
						<td class="mono">{log.table_name ?? '—'}</td>
						<td class="mono">{log.record_id ? log.record_id.slice(0, 8) + '…' : '—'}</td>
						<td class="mono">{log.user_id ? log.user_id.slice(0, 8) + '…' : '—'}</td>
						<td class="mono">{log.ip_address ?? '—'}</td>
					</tr>
				{/each}
				{#if logs.length === 0}<tr><td colspan="6" class="empty">Tidak ada data.</td></tr>{/if}
			</tbody>
		</table>
	</div>

	{#if data.total > 100}
		<div class="pagination">
			{#if data.page > 0}<a href="?page={data.page - 1}" class="page-link">← Sebelumnya</a>{/if}
			<span class="page-info">Halaman {data.page + 1}</span>
			{#if (data.page + 1) * 100 < data.total}<a href="?page={data.page + 1}" class="page-link"
					>Berikutnya →</a
				>{/if}
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 1300px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
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
	.btn-csv {
		padding: 0.375rem 0.875rem;
		background: color-mix(in srgb, var(--color-success) 12%, transparent);
		color: color-mix(in srgb, var(--color-success) 80%, black);
		border: 1px solid color-mix(in srgb, var(--color-success) 30%, transparent);
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
		font-weight: 600;
		text-decoration: none;
	}
	.filter-bar {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	.filter-input {
		padding: 0.5rem 0.875rem;
		font-size: 0.875rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		outline: none;
		min-width: 260px;
		font-family: var(--font-mono);
	}
	.filter-input:focus {
		border-color: var(--color-primary);
	}
	.btn-filter {
		padding: 0.5rem 1rem;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		cursor: pointer;
	}
	.btn-clear {
		font-size: 0.875rem;
		color: var(--color-error);
		text-decoration: none;
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
	.date {
		white-space: nowrap;
		color: var(--color-muted);
	}
	.mono {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--color-muted);
	}
	.action-code {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		background: color-mix(in srgb, var(--color-primary) 8%, transparent);
		color: var(--color-primary);
		padding: 0.125rem 0.375rem;
		border-radius: var(--radius-sm);
	}
	.empty {
		text-align: center;
		padding: 2rem;
		color: var(--color-muted);
		font-style: italic;
	}
	.pagination {
		display: flex;
		align-items: center;
		gap: 1rem;
		justify-content: center;
	}
	.page-link {
		color: var(--color-primary);
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
	}
	.page-info {
		font-size: 0.875rem;
		color: var(--color-muted);
	}
</style>
