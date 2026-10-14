<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	const practices = $derived(data.practices);
	const RESOURCE_ICONS: Record<string, string> = {
		GOOGLE_DOCS: '📝',
		GOOGLE_SHEETS: '📊',
		GOOGLE_SLIDES: '📑',
		DRIVE_FILE: '📁',
		EXTERNAL_URL: '🔗',
		EMBEDDED_FORM: '📋'
	};
</script>

<svelte:head><title>Let's Practice — ALC</title></svelte:head>
<div class="page">
	<header class="page-header">
		<h1 class="page-title">📝 Let's Practice</h1>
		<p class="page-subtitle">Latihan dan sumber daya operasional.</p>
	</header>
	{#if practices.length === 0}
		<p class="empty">Belum ada latihan yang tersedia.</p>
	{:else}
		<ul class="practice-list">
			{#each practices as p (p.id)}
				<li class="practice-item">
					<span class="practice-icon">{RESOURCE_ICONS[p.resource_type] ?? '🔗'}</span>
					<div class="practice-info">
						<span class="practice-title">{p.title}</span>
						{#if p.description}<p class="practice-desc">{p.description}</p>{/if}
						<div class="practice-actions">
							{#if p.resource_url}
								<a href={p.resource_url} target="_blank" rel="noopener noreferrer" class="btn-open"
									>Buka</a
								>
							{:else if p.drive_file_id}
								<a
									href="/api/files/{p.drive_file_id}/stream"
									target="_blank"
									rel="noopener noreferrer"
									class="btn-open">Buka File</a
								>
							{/if}
							{#if !p.is_completed}
								<form method="POST" action="?/complete" use:enhance>
									<input type="hidden" name="practice_id" value={p.id} />
									<button type="submit" class="btn-done">✓ Selesai</button>
								</form>
							{:else}
								<span class="done-chip">✓ Selesai</span>
							{/if}
						</div>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.page {
		max-width: 760px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.page-title {
		font-size: 1.75rem;
		font-weight: 700;
		margin: 0;
	}
	.page-subtitle {
		color: var(--color-muted);
		margin: 0.25rem 0 0;
	}
	.empty {
		color: var(--color-muted);
		font-style: italic;
	}
	.practice-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}
	.practice-item {
		display: flex;
		gap: 1rem;
		padding: 1rem 1.125rem;
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface);
		align-items: flex-start;
	}
	.practice-item:last-child {
		border-bottom: none;
	}
	.practice-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
		margin-top: 0.125rem;
	}
	.practice-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.practice-title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-text);
	}
	.practice-desc {
		font-size: 0.8125rem;
		color: var(--color-muted);
		margin: 0;
	}
	.practice-actions {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		flex-wrap: wrap;
	}
	.btn-open {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 10%, transparent);
		padding: 0.25rem 0.75rem;
		border-radius: var(--radius-sm);
		text-decoration: none;
	}
	.btn-done {
		font-size: 0.8125rem;
		font-weight: 600;
		color: white;
		background: var(--color-success);
		border: none;
		padding: 0.25rem 0.75rem;
		border-radius: var(--radius-sm);
		cursor: pointer;
	}
	.done-chip {
		font-size: 0.8125rem;
		font-weight: 600;
		color: color-mix(in srgb, var(--color-success) 80%, black);
		background: color-mix(in srgb, var(--color-success) 12%, transparent);
		padding: 0.25rem 0.75rem;
		border-radius: var(--radius-sm);
	}
</style>
