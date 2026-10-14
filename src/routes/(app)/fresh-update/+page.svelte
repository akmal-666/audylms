<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	const posts = $derived(data.posts);
</script>

<svelte:head><title>Fresh Update — ALC</title></svelte:head>
<div class="page">
	<header class="page-header">
		<h1 class="page-title">📰 Fresh Update</h1>
		<p class="page-subtitle">Info terbaru dari klinik.</p>
	</header>
	{#if posts.length === 0}
		<p class="empty">Belum ada update.</p>
	{:else}
		<div class="posts-list">
			{#each posts as post (post.id)}
				<a href="/fresh-update/{post.id}" class="post-card">
					{#if post.cover}
						<div class="post-cover">
							<img src="/api/files/{post.cover.id}/stream" alt={post.title} loading="lazy" />
						</div>
					{/if}
					<div class="post-body">
						<span class="post-date"
							>{new Date(post.published_at ?? post.created_at).toLocaleDateString('id-ID', {
								day: 'numeric',
								month: 'long',
								year: 'numeric'
							})}</span
						>
						<h2 class="post-title">{post.title}</h2>
						{#if post.summary}<p class="post-summary">{post.summary}</p>{/if}
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 800px;
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
	.posts-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.post-card {
		display: flex;
		gap: 1.25rem;
		padding: 1.125rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
		text-decoration: none;
		color: inherit;
		transition:
			border-color 0.15s,
			transform 0.15s;
		align-items: flex-start;
	}
	.post-card:hover {
		border-color: var(--color-secondary);
		transform: translateY(-1px);
	}
	.post-cover {
		flex-shrink: 0;
		width: 120px;
		height: 80px;
		border-radius: var(--radius-md);
		overflow: hidden;
		background: var(--color-bg-subtle);
	}
	.post-cover img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.post-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.post-date {
		font-size: 0.75rem;
		color: var(--color-muted);
	}
	.post-title {
		font-size: 1rem;
		font-weight: 700;
		margin: 0;
		color: var(--color-text);
	}
	.post-summary {
		font-size: 0.8125rem;
		color: var(--color-text-secondary);
		margin: 0;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		line-clamp: 2;
	}
</style>
