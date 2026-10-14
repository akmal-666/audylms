<script lang="ts">
	import type { PageData } from './$types';
	import type { Tables } from '$lib/types/database.types';
	let { data }: { data: PageData } = $props();
	const post = $derived(data.post);
	const attachments = $derived(data.attachments);
	const is_read = $derived(data.is_read);
</script>

<svelte:head><title>{post.title} — Fresh Update</title></svelte:head>
<div class="page">
	<nav class="breadcrumb">
		<a href="/fresh-update">Fresh Update</a>
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg
		> <span>Artikel</span>
	</nav>

	{#if post.cover}
		<figure class="cover-figure">
			<img src="/api/files/{post.cover.id}/stream" alt={post.title} class="cover-img" />
		</figure>
	{/if}

	<header class="post-header">
		<span class="post-date"
			>{new Date(post.published_at ?? post.created_at).toLocaleDateString('id-ID', {
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			})}</span
		>
		<h1 class="post-title">{post.title}</h1>
		{#if post.summary}<p class="post-summary">{post.summary}</p>{/if}
		{#if is_read}<span class="read-badge">✓ Sudah Dibaca</span>{/if}
	</header>

	{#if post.body}
		<div class="post-body">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html post.body}
		</div>
	{/if}

	{#if attachments.length > 0}
		<div class="attachments-section">
			<h2 class="att-title">📎 Lampiran</h2>
			<ul class="att-list">
				{#each attachments as att (att.id)}
					{@const df = att.drive_file as Tables<'drive_files'>}
					<li class="att-item">
						{#if att.attachment_type === 'IMAGE'}
							<figure class="att-fig">
								<img
									src="/api/files/{df.id}/stream"
									alt={att.display_name ?? df.name}
									class="att-img"
									loading="lazy"
								/>
							</figure>
						{:else if att.attachment_type === 'VIDEO'}
							<video controls preload="metadata" class="att-video"
								><source src="/api/files/{df.id}/stream" type={df.mime_type} /></video
							>
						{:else}
							<div class="att-doc">
								<span class="att-doc-icon"
									>{att.attachment_type === 'PDF'
										? '📄'
										: att.attachment_type === 'SPREADSHEET'
											? '📊'
											: att.attachment_type === 'PRESENTATION'
												? '📑'
												: '📋'}</span
								>
								<span class="att-doc-name">{att.display_name ?? df.name}</span>
								<a
									href="/api/files/{df.id}/stream"
									target="_blank"
									rel="noopener noreferrer"
									class="att-open">Buka</a
								>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<a href="/fresh-update" class="btn-back">← Kembali</a>
</div>

<style>
	.page {
		max-width: 760px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
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
	.cover-figure {
		margin: 0;
		border-radius: var(--radius-xl);
		overflow: hidden;
		max-height: 320px;
	}
	.cover-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.post-header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.post-date {
		font-size: 0.8125rem;
		color: var(--color-muted);
	}
	.post-title {
		font-size: 1.75rem;
		font-weight: 700;
		margin: 0;
	}
	.post-summary {
		margin: 0;
		color: var(--color-text-secondary);
		font-size: 1rem;
		line-height: 1.6;
	}
	.read-badge {
		font-size: 0.8125rem;
		font-weight: 600;
		color: color-mix(in srgb, var(--color-success) 80%, black);
	}
	.post-body {
		font-size: 0.9375rem;
		line-height: 1.75;
		color: var(--color-text);
	}
	.post-body :global(h2) {
		font-size: 1.25rem;
		font-weight: 700;
		margin: 1.25em 0 0.5em;
	}
	.post-body :global(p) {
		margin: 0 0 0.875em;
	}
	.post-body :global(ul),
	.post-body :global(ol) {
		padding-left: 1.5em;
		margin-bottom: 0.875em;
	}
	.attachments-section {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
		padding: 1.125rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}
	.att-title {
		font-size: 0.9375rem;
		font-weight: 700;
		margin: 0;
	}
	.att-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.att-fig {
		margin: 0;
	}
	.att-img {
		max-width: 100%;
		border-radius: var(--radius-md);
		display: block;
	}
	.att-video {
		width: 100%;
		border-radius: var(--radius-md);
	}
	.att-doc {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem 0.875rem;
		background: var(--color-bg-subtle);
		border-radius: var(--radius-md);
	}
	.att-doc-icon {
		font-size: 1.375rem;
		flex-shrink: 0;
	}
	.att-doc-name {
		flex: 1;
		font-size: 0.875rem;
		font-weight: 500;
	}
	.att-open {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: none;
	}
	.btn-back {
		font-size: 0.875rem;
		color: var(--color-muted);
		text-decoration: none;
	}
	.btn-back:hover {
		color: var(--color-primary);
	}
</style>
