<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const stages = $derived(data.stages);
</script>

<svelte:head>
	<title>Growth Journey — Admin — ALC</title>
</svelte:head>

<div class="page">
	<div class="page-header">
		<div>
			<h1 class="page-title">Growth Journey</h1>
			<p class="page-subtitle">Kelola stage, materi, dan konten pembelajaran.</p>
		</div>
		<a href="/admin/growth-journey/stages/new" class="btn-primary">+ Tambah Stage</a>
	</div>

	{#if stages.length === 0}
		<div class="empty">
			<p>Belum ada stage. <a href="/admin/growth-journey/stages/new">Buat stage pertama</a>.</p>
		</div>
	{:else}
		<div class="stages-table-wrap">
			<table class="stages-table">
				<thead>
					<tr>
						<th>#</th>
						<th>Judul</th>
						<th>Status</th>
						<th>Poin</th>
						<th>Filter Posisi</th>
						<th>Aksi</th>
					</tr>
				</thead>
				<tbody>
					{#each stages as stage, i (stage.id)}
						<tr>
							<td class="num-cell">{i + 1}</td>
							<td>
								<a href="/admin/growth-journey/stages/{stage.id}" class="stage-link"
									>{stage.title}</a
								>
							</td>
							<td>
								<span class="status-chip" class:published={stage.is_published}>
									{stage.is_published ? 'Diterbitkan' : 'Draft'}
								</span>
							</td>
							<td>{stage.points_reward}</td>
							<td class="filter-cell">
								{stage.position_filter?.join(', ') ?? 'Semua'}
							</td>
							<td>
								<a href="/admin/growth-journey/stages/{stage.id}" class="action-link">Edit</a>
								<a href="/admin/growth-journey/stages/{stage.id}/materials/new" class="action-link"
									>+ Materi</a
								>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 1100px;
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
		margin: 0.25rem 0 0;
		color: var(--color-muted);
		font-size: 0.9375rem;
	}
	.btn-primary {
		display: inline-flex;
		padding: 0.5rem 1.125rem;
		background: var(--color-primary);
		color: white;
		border-radius: var(--radius-md);
		font-size: 0.9rem;
		font-weight: 600;
		text-decoration: none;
	}
	.btn-primary:hover {
		background: var(--color-primary-light);
	}
	.empty {
		color: var(--color-muted);
		padding: 2rem 0;
	}
	.empty a {
		color: var(--color-primary);
	}
	.stages-table-wrap {
		overflow-x: auto;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}
	.stages-table {
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
	.num-cell {
		color: var(--color-muted);
		font-weight: 700;
	}
	.stage-link {
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: none;
	}
	.stage-link:hover {
		text-decoration: underline;
	}
	.status-chip {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
		background: var(--color-bg-subtle);
		color: var(--color-muted);
	}
	.status-chip.published {
		background: color-mix(in srgb, var(--color-success) 15%, transparent);
		color: color-mix(in srgb, var(--color-success) 80%, black);
	}
	.filter-cell {
		font-size: 0.8125rem;
		color: var(--color-muted);
	}
	.action-link {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: none;
		margin-right: 0.75rem;
	}
	.action-link:hover {
		text-decoration: underline;
	}
</style>
