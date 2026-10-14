<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const catalogue = $derived(data.catalogue);
	const earned = $derived(data.earned);
</script>

<svelte:head>
	<title>Lencana — Audy Learning Centre</title>
</svelte:head>

<div class="page">
	<div class="page-header">
		<h1 class="page-title">🏅 Lencana</h1>
		<p class="page-subtitle">
			{earned.length} dari {catalogue.length} lencana diraih
		</p>
	</div>

	<div class="badges-grid">
		{#each catalogue as badge (badge.id)}
			<div class="badge-card" class:earned={badge.is_earned} class:locked={!badge.is_earned}>
				<div class="badge-icon" class:earned={badge.is_earned}>{badge.icon ?? '🏅'}</div>
				<div class="badge-info">
					<span class="badge-title">{badge.title}</span>
					{#if badge.description}
						<span class="badge-desc">{badge.description}</span>
					{/if}
				</div>
				{#if badge.is_earned}
					<div class="badge-check" aria-label="Sudah diraih">✓</div>
				{:else}
					<div class="badge-lock" aria-label="Belum diraih">🔒</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.page {
		max-width: 800px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.page-header {
		display: contents;
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

	.badges-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 0.875rem;
	}

	.badge-card {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		padding: 1rem 1.125rem;
		background: var(--color-surface);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-lg);
		transition: border-color 0.15s;
	}
	.badge-card.earned {
		border-color: color-mix(in srgb, var(--color-highlight) 60%, transparent);
		background: color-mix(in srgb, var(--color-highlight) 5%, var(--color-surface));
	}
	.badge-card.locked {
		opacity: 0.55;
	}

	.badge-icon {
		font-size: 2rem;
		flex-shrink: 0;
		line-height: 1;
		filter: grayscale(0);
	}
	.badge-icon:not(.earned) {
		filter: grayscale(1);
	}

	.badge-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	.badge-title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-text);
	}
	.badge-desc {
		font-size: 0.8125rem;
		color: var(--color-muted);
	}

	.badge-check {
		font-size: 0.875rem;
		font-weight: 700;
		color: color-mix(in srgb, var(--color-success) 80%, black);
		background: color-mix(in srgb, var(--color-success) 15%, transparent);
		width: 26px;
		height: 26px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.badge-lock {
		font-size: 0.875rem;
		flex-shrink: 0;
	}
</style>
