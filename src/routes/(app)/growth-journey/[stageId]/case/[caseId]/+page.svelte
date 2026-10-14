<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import type { Tables } from '$lib/types/database.types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const gjCase = $derived(data.gjCase);
	const stageId = $derived(data.stageId);

	let completing = $state(false);

	const isCompleted = $derived(
		gjCase.user_progress?.status === 'COMPLETED' || form?.completed === true
	);
	const needsRetake = $derived(
		gjCase.requires_retake && gjCase.user_progress?.version_number !== gjCase.version_number
	);
</script>

<svelte:head>
	<title>{gjCase.title} — Studi Kasus — ALC</title>
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
		<span aria-current="page">{gjCase.title}</span>
	</nav>

	<!-- Header -->
	<div class="case-header">
		<div class="case-header-top">
			<h1 class="case-title">🔍 {gjCase.title}</h1>
			<div class="version-badge">v{gjCase.version_number}</div>
			{#if isCompleted && !needsRetake}
				<span class="completed-badge">✅ Selesai</span>
			{:else if needsRetake}
				<span class="retake-badge">⟳ Perlu Dibaca Ulang</span>
			{/if}
		</div>
		{#if gjCase.description}<p class="case-desc">{gjCase.description}</p>{/if}
	</div>

	<!-- Case body (rich text) -->
	{#if gjCase.body}
		<div class="case-body">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html gjCase.body}
		</div>
	{/if}

	<!-- Attachments -->
	{#if gjCase.attachments.length > 0}
		<div class="attachments-section">
			<h2 class="section-title">📎 Lampiran Kasus</h2>
			<div class="attachment-grid">
				{#each gjCase.attachments as att (att.id)}
					{@const df = att.drive_file as Tables<'drive_files'> | null}
					<div class="attachment-card">
						{#if att.attachment_type === 'IMAGE' && df}
							<figure class="att-figure">
								<img
									src="/api/files/{df.id}/stream"
									alt={att.display_name ?? df.name}
									loading="lazy"
									class="att-image"
								/>
								{#if att.display_name}
									<figcaption class="att-caption">{att.display_name}</figcaption>
								{/if}
							</figure>
						{:else if att.attachment_type === 'VIDEO' && df}
							<div class="att-video-wrap">
								<video controls preload="metadata" class="att-video">
									<source src="/api/files/{df.id}/stream" type={df.mime_type} />
								</video>
								{#if att.display_name}
									<p class="att-caption">{att.display_name}</p>
								{/if}
							</div>
						{:else if df}
							<div class="att-doc">
								<span class="att-icon">
									{att.attachment_type === 'PDF'
										? '📄'
										: att.attachment_type === 'PRESENTATION'
											? '📊'
											: '📋'}
								</span>
								<div class="att-info">
									<span class="att-name">{att.display_name ?? df.name}</span>
									<a
										href="/api/files/{df.id}/stream"
										target="_blank"
										rel="noopener noreferrer"
										class="att-open"
									>
										Buka
									</a>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Complete button -->
	<div class="action-bar">
		{#if isCompleted && !needsRetake}
			<div class="done-message">
				<svg
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg
				>
				Studi kasus selesai! <a href="/growth-journey/{stageId}">Kembali ke stage</a>.
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
		<a href="/growth-journey/{stageId}" class="btn-back">← Kembali ke Stage</a>
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

	.case-header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.case-header-top {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	.case-title {
		font-size: 1.625rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0;
		flex: 1;
	}
	.case-desc {
		margin: 0;
		color: var(--color-text-secondary);
		font-size: 0.9375rem;
	}

	.version-badge {
		font-size: 0.6875rem;
		font-weight: 700;
		padding: 0.125rem 0.5rem;
		background: var(--color-bg-subtle);
		color: var(--color-muted);
		border-radius: 999px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		flex-shrink: 0;
	}
	.completed-badge {
		font-size: 0.8125rem;
		font-weight: 600;
		padding: 0.25rem 0.625rem;
		background: color-mix(in srgb, var(--color-success) 15%, transparent);
		color: color-mix(in srgb, var(--color-success) 80%, black);
		border-radius: 999px;
		flex-shrink: 0;
	}
	.retake-badge {
		font-size: 0.8125rem;
		font-weight: 600;
		padding: 0.25rem 0.625rem;
		background: color-mix(in srgb, var(--color-warning) 15%, transparent);
		color: var(--color-warning);
		border-radius: 999px;
		flex-shrink: 0;
	}

	.case-body {
		font-size: 0.9375rem;
		line-height: 1.75;
		color: var(--color-text);
	}
	.case-body :global(h2) {
		font-size: 1.25rem;
		font-weight: 700;
		margin: 1.25em 0 0.5em;
	}
	.case-body :global(h3) {
		font-size: 1.0625rem;
		font-weight: 700;
		margin: 1em 0 0.5em;
	}
	.case-body :global(p) {
		margin: 0 0 0.875em;
	}
	.case-body :global(ul),
	.case-body :global(ol) {
		padding-left: 1.5em;
		margin-bottom: 0.875em;
	}
	.case-body :global(blockquote) {
		border-left: 3px solid var(--color-secondary);
		padding-left: 1rem;
		color: var(--color-text-secondary);
		font-style: italic;
		margin: 1em 0;
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
		margin: 0 0 1rem;
	}
	.attachment-grid {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.attachment-card {
		display: contents;
	}
	.att-figure {
		margin: 0;
	}
	.att-image {
		max-width: 100%;
		border-radius: var(--radius-md);
		display: block;
	}
	.att-caption {
		font-size: 0.8125rem;
		color: var(--color-muted);
		text-align: center;
		margin-top: 0.375rem;
	}
	.att-video-wrap {
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
		padding: 0.75rem 1rem;
		background: var(--color-bg-subtle);
		border-radius: var(--radius-md);
	}
	.att-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}
	.att-info {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.att-name {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--color-text);
	}
	.att-open {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: none;
	}

	.action-bar {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
		padding: 1.125rem;
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
	}
	.btn-complete:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.done-message {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: color-mix(in srgb, var(--color-success) 80%, black);
		font-weight: 600;
	}
	.done-message a {
		color: var(--color-primary);
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
