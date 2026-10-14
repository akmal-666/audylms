<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	const category = $derived(data.category);
	const topics = $derived(data.topics);
</script>

<svelte:head><title>{category.title} — Product Knowledge</title></svelte:head>

<div class="page">
	<nav class="breadcrumb">
		<a href="/product-knowledge">Product Knowledge</a>
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg
		> <span>{category.title}</span>
	</nav>
	<h1 class="page-title">{category.icon ?? '💡'} {category.title}</h1>
	{#if category.description}<p class="page-desc">{category.description}</p>{/if}

	{#if topics.length === 0}
		<p class="empty">Belum ada topik.</p>
	{:else}
		<ul class="topic-list">
			{#each topics as topic (topic.id)}
				<li class="topic-row">
					<a href="/product-knowledge/{category.id}/{topic.id}" class="topic-title">{topic.title}</a
					>
					{#if topic.summary}<p class="topic-summary">{topic.summary}</p>{/if}
					{#if topic.estimated_min}<span class="topic-meta">⏱ {topic.estimated_min} menit</span
						>{/if}
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
	.page-desc {
		color: var(--color-text-secondary);
		margin: 0;
	}
	.empty {
		color: var(--color-muted);
		font-style: italic;
	}
	.topic-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}
	.topic-row {
		padding: 0.875rem 1.125rem;
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface);
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.topic-row:last-child {
		border-bottom: none;
	}
	.topic-title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: none;
	}
	.topic-title:hover {
		text-decoration: underline;
	}
	.topic-summary {
		font-size: 0.8125rem;
		color: var(--color-muted);
		margin: 0;
	}
	.topic-meta {
		font-size: 0.75rem;
		color: var(--color-placeholder);
	}
</style>
