<script lang="ts">
	import type { AuditLog } from './+page.server';

	// Use concrete type instead of relying on generated PageData
	let { data }: { data: { logs: AuditLog[] } } = $props();

	const logs = $derived(data.logs);
</script>

<svelte:head>
	<title>Audit Log — Audy Learning Centre</title>
</svelte:head>

<div class="page">
	<h1>Audit Log</h1>
	<p class="subtitle">Riwayat aktivitas sistem</p>

	{#if logs.length === 0}
		<p class="empty">Belum ada data audit log.</p>
	{:else}
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Waktu</th>
						<th>Aksi</th>
						<th>Tabel</th>
						<th>IP</th>
					</tr>
				</thead>
				<tbody>
					{#each logs as log (log.id)}
						<tr>
							<td>{new Date(log.created_at).toLocaleString('id-ID')}</td>
							<td><code>{log.action}</code></td>
							<td>{log.table_name ?? '—'}</td>
							<td>{log.ip_address ?? '—'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 1200px;
		margin: 0 auto;
	}

	h1 {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0 0 0.25rem;
	}

	.subtitle {
		color: var(--color-muted);
		margin: 0 0 1.5rem;
		font-size: 0.9375rem;
	}

	.empty {
		color: var(--color-muted);
		font-style: italic;
	}

	.table-wrapper {
		overflow-x: auto;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}

	table {
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
		color: var(--color-text);
	}

	tbody tr:last-child td {
		border-bottom: none;
	}

	code {
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		background: var(--color-bg-subtle);
		padding: 0.125rem 0.375rem;
		border-radius: var(--radius-sm);
	}
</style>
