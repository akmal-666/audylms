<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import ContentBlock from '$lib/components/growth-journey/ContentBlock.svelte';
	import type { Tables } from '$lib/types/database.types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const material = $derived(data.material);
	const stageId = $derived(data.stageId);
	let completing = $state(false);
</script>

<svelte:head>
	<title>{material.title} — Growth Journey — ALC</title>
</svelte:head>

<div class="page">
	<!-- Breadcrumb -->
	<nav class="breadcrumb" aria-label="Breadcrumb">
		<a href="/growth-journey">Growth Journey</a>
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg
		>
		<a href="/growth-journey/{stageId}">Stage</a>
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg
		>
		<span aria-current="page">{material.title}</span>
	</nav>

	<!-- Material header -->
	<div class="material-header">
		<h1 class="material-title">{material.title}</h1>
		{#if material.summary}
			<p class="material-summary">{material.summary}</p>
		{/if}
		<div class="material-meta">
			{#if material.estimated_min}<span>⏱ ~{material.estimated_min} menit</span>{/if}
			{#if material.is_required}<span class="required-tag">Wajib</span>{/if}
		</div>
	</div>

	<!-- Content blocks -->
	{#if material.content_blocks.length > 0}
		<div class="content-blocks">
			{#each material.content_blocks as block (block.id)}
				<ContentBlock {block} />
			{/each}
		</div>
	{/if}

	<!-- Attachments -->
	{#if material.attachments.length > 0}
		<div class="attachments-section">
			<h2 class="section-title">📎 Lampiran</h2>
			<ul class="attachment-list">
				{#each material.attachments as att (att.id)}
					{@const df = att.drive_file as Tables<'drive_files'> | null}
					<li class="attachment-item">
						<span class="att-icon">
							{att.attachment_type === 'IMAGE'
								? '🖼️'
								: att.attachment_type === 'VIDEO'
									? '🎬'
									: att.attachment_type === 'PDF'
										? '📄'
										: '📎'}
						</span>
						<span class="att-name">{att.display_name ?? df?.name ?? 'File'}</span>
						{#if df}
							<a
								href="/api/files/{df.id}/stream"
								target="_blank"
								rel="noopener noreferrer"
								class="att-btn"
							>
								Buka
							</a>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<!-- Complete button -->
	<div class="complete-section">
		{#if form?.completed}
			<div class="complete-success">
				<svg
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg
				>
				Materi selesai! Kembali ke <a href="/growth-journey/{stageId}">stage</a>.
			</div>
		{:else}
			<form
				method="POST"
				action="?/complete"
				use:enhance={() => {
					completing = true;
					return async ({ update }) => {
						completing = false;
						await update();
					};
				}}
			>
				<button type="submit" class="btn-complete" disabled={completing}>
					{completing ? 'Menyimpan…' : '✓ Tandai Selesai'}
				</button>
			</form>
		{/if}
		<a href="/growth-journey/{stageId}" class="back-link"> ← Kembali ke Stage </a>
	</div>
</div>

<style>
	.page {
		max-width: 720px;
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
	.breadcrumb a:hover {
		text-decoration: underline;
	}

	.material-header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.material-title {
		font-size: 1.625rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0;
	}
	.material-summary {
		margin: 0;
		color: var(--color-text-secondary);
		font-size: 1rem;
		line-height: 1.6;
	}
	.material-meta {
		display: flex;
		gap: 0.75rem;
		font-size: 0.8125rem;
		color: var(--color-muted);
		flex-wrap: wrap;
	}
	.required-tag {
		color: var(--color-primary);
		font-weight: 600;
	}

	.content-blocks {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.attachments-section {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.25rem;
	}
	.section-title {
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0 0 0.875rem;
	}
	.attachment-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.attachment-item {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--color-border);
	}
	.attachment-item:last-child {
		border-bottom: none;
	}
	.att-icon {
		font-size: 1.25rem;
		flex-shrink: 0;
	}
	.att-name {
		flex: 1;
		font-size: 0.9rem;
		color: var(--color-text);
	}
	.att-btn {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 10%, transparent);
		padding: 0.25rem 0.75rem;
		border-radius: var(--radius-sm);
		text-decoration: none;
		flex-shrink: 0;
	}
	.att-btn:hover {
		background: color-mix(in srgb, var(--color-primary) 18%, transparent);
	}

	.complete-section {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
		padding: 1.25rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}
	.btn-complete {
		padding: 0.625rem 1.5rem;
		background: var(--color-success);
		color: white;
		border: none;
		border-radius: var(--radius-md);
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.15s;
	}
	.btn-complete:hover:not(:disabled) {
		opacity: 0.9;
	}
	.btn-complete:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.complete-success {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: color-mix(in srgb, var(--color-success) 80%, black);
		font-weight: 600;
	}
	.complete-success a {
		color: var(--color-primary);
	}
	.back-link {
		font-size: 0.875rem;
		color: var(--color-muted);
		text-decoration: none;
	}
	.back-link:hover {
		color: var(--color-primary);
	}
</style>
