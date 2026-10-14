<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	const categories = $derived(data.categories);
</script>

<svelte:head><title>Product Knowledge — ALC</title></svelte:head>

<div class="page">
	<header class="page-header">
		<h1 class="page-title">💡 Product Knowledge</h1>
		<p class="page-subtitle">Pengetahuan produk dan layanan klinik.</p>
	</header>

	{#if categories.length === 0}
		<p class="empty">Belum ada kategori yang tersedia.</p>
	{:else}
		<div class="categories-grid">
			{#each categories as cat (cat.id)}
				<a href="/product-knowledge/{cat.id}" class="cat-card">
					{#if cat.icon}<span class="cat-icon">{cat.icon}</span>{/if}
					<div class="cat-info">
						<span class="cat-title">{cat.title}</span>
						{#if cat.description}<span class="cat-desc">{cat.description}</span>{/if}
					</div>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						class="cat-arrow"
						aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg
					>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 900px;
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
	.categories-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1rem;
	}
	.cat-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.125rem 1.25rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		text-decoration: none;
		color: inherit;
		transition:
			border-color 0.15s,
			transform 0.15s;
	}
	.cat-card:hover {
		border-color: var(--color-secondary);
		transform: translateY(-1px);
	}
	.cat-icon {
		font-size: 1.75rem;
		flex-shrink: 0;
	}
	.cat-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	.cat-title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-text);
	}
	.cat-desc {
		font-size: 0.8125rem;
		color: var(--color-muted);
	}
	.cat-arrow {
		color: var(--color-muted);
		flex-shrink: 0;
	}
	.cat-card:hover .cat-arrow {
		color: var(--color-primary);
	}
</style>
