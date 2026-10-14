<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import ContentBlock from '$lib/components/growth-journey/ContentBlock.svelte';
	import type { GjContentType } from '$lib/types/database.types';
	import type { Tables } from '$lib/types/database.types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const topic = $derived(data.topic);
	const sections = $derived(data.sections);
	const progress = $derived(data.progress);
	const categoryId = $derived(data.categoryId);

	// Adapt pk_sections to the ContentBlock interface
	type SectionWithFile = Tables<'pk_sections'> & { drive_file: Tables<'drive_files'> | null };
	function toBlock(s: SectionWithFile) {
		return {
			id: s.id,
			material_id: '',
			sort_order: s.sort_order,
			content_type: s.content_type as GjContentType,
			body: s.body,
			drive_file_id: s.drive_file_id,
			drive_file: s.drive_file,
			caption: s.caption,
			created_at: s.created_at,
			updated_at: s.updated_at
		};
	}

	let marking = $state(false);
	const isRead = $derived(!!progress || form?.done === true);
</script>

<svelte:head><title>{topic.title} — Product Knowledge</title></svelte:head>

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
		>
		<a href="/product-knowledge/{categoryId}">Kategori</a>
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg
		>
		<span>{topic.title}</span>
	</nav>

	<header class="topic-header">
		<h1 class="topic-title">{topic.title}</h1>
		{#if topic.summary}<p class="topic-summary">{topic.summary}</p>{/if}
		<div class="topic-meta">
			{#if topic.estimated_min}<span>⏱ ~{topic.estimated_min} menit</span>{/if}
			{#if isRead}<span class="read-badge">✓ Sudah Dibaca</span>{/if}
		</div>
	</header>

	{#if sections.length > 0}
		<div class="sections">
			{#each sections as section (section.id)}
				<ContentBlock block={toBlock(section)} />
			{/each}
		</div>
	{/if}

	<div class="action-bar">
		{#if !isRead}
			<form
				method="POST"
				action="?/markRead"
				use:enhance={() => {
					marking = true;
					return async ({ update }) => {
						marking = false;
						await update();
					};
				}}
			>
				<button type="submit" class="btn-read" disabled={marking}
					>{marking ? 'Menyimpan…' : '✓ Tandai Sudah Dibaca'}</button
				>
			</form>
		{:else}
			<span class="done-msg">✓ Topik selesai dibaca</span>
		{/if}
		<a href="/product-knowledge/{categoryId}" class="btn-back">← Kembali</a>
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
	.topic-header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.topic-title {
		font-size: 1.625rem;
		font-weight: 700;
		margin: 0;
	}
	.topic-summary {
		margin: 0;
		color: var(--color-text-secondary);
	}
	.topic-meta {
		display: flex;
		gap: 0.75rem;
		font-size: 0.8125rem;
		color: var(--color-muted);
	}
	.read-badge {
		color: color-mix(in srgb, var(--color-success) 80%, black);
		font-weight: 600;
	}
	.sections {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.action-bar {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}
	.btn-read {
		padding: 0.625rem 1.5rem;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-md);
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
	}
	.btn-read:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.done-msg {
		color: color-mix(in srgb, var(--color-success) 80%, black);
		font-weight: 600;
	}
	.btn-back {
		font-size: 0.875rem;
		color: var(--color-muted);
		text-decoration: none;
	}
</style>
