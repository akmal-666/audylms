<script lang="ts">
	import type { PageData } from './$types';
	import type { StageWithCounts } from '$lib/types/growth-journey.types';

	let { data }: { data: PageData } = $props();

	const progress = $derived(data.progress);

	function stageStatusClass(stage: StageWithCounts): string {
		const s = stage.user_progress?.status;
		if (s === 'COMPLETED') return 'stage-completed';
		if (s === 'IN_PROGRESS') return 'stage-in-progress';
		return 'stage-not-started';
	}

	function stageStatusLabel(stage: StageWithCounts): string {
		const s = stage.user_progress?.status;
		if (s === 'COMPLETED') return 'Selesai';
		if (s === 'IN_PROGRESS') return 'Sedang Berjalan';
		return 'Belum Dimulai';
	}

	function progressPercent(stage: StageWithCounts): number {
		if (stage.material_count === 0) return 0;
		return Math.round((stage.completed_material_count / stage.material_count) * 100);
	}
</script>

<svelte:head>
	<title>Growth Journey — Audy Learning Centre</title>
</svelte:head>

<div class="page">
	<!-- Header -->
	<header class="page-header">
		<div>
			<h1 class="page-title">Growth Journey 🌱</h1>
			<p class="page-subtitle">Jalur pembelajaran terstruktur untuk perkembangan karirmu.</p>
		</div>
		<div class="summary-badges">
			<div class="summary-badge">
				<span class="summary-value">{progress.completed_stages}</span>
				<span class="summary-label">Selesai</span>
			</div>
			<div class="summary-badge">
				<span class="summary-value">{progress.total_stages}</span>
				<span class="summary-label">Total Stage</span>
			</div>
			<div class="summary-badge highlight">
				<span class="summary-value">{progress.total_points_earned}</span>
				<span class="summary-label">Poin</span>
			</div>
		</div>
	</header>

	<!-- Overall progress bar -->
	{#if progress.total_stages > 0}
		<div class="overall-progress">
			<div class="overall-progress-bar">
				<div
					class="overall-progress-fill"
					style="width: {Math.round((progress.completed_stages / progress.total_stages) * 100)}%"
				></div>
			</div>
			<span class="overall-progress-label">
				{Math.round((progress.completed_stages / progress.total_stages) * 100)}% selesai
			</span>
		</div>
	{/if}

	<!-- Stages -->
	{#if progress.stages.length === 0}
		<div class="empty-state">
			<p>Belum ada stage yang tersedia untukmu.</p>
		</div>
	{:else}
		<div class="stages-list">
			{#each progress.stages as stage, i (stage.id)}
				<a href="/growth-journey/{stage.id}" class="stage-card {stageStatusClass(stage)}">
					<!-- Stage number -->
					<div class="stage-number" aria-label="Stage {i + 1}">
						{#if stage.user_progress?.status === 'COMPLETED'}
							<svg
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"
								aria-hidden="true"
							>
								<polyline points="20 6 9 17 4 12" />
							</svg>
						{:else}
							{i + 1}
						{/if}
					</div>

					<!-- Content -->
					<div class="stage-content">
						<div class="stage-meta">
							<span class="stage-status-badge {stageStatusClass(stage)}">
								{stageStatusLabel(stage)}
							</span>
							{#if stage.points_reward > 0}
								<span class="stage-points">+{stage.points_reward} poin</span>
							{/if}
						</div>
						<h2 class="stage-title">{stage.title}</h2>
						{#if stage.description}
							<p class="stage-description">{stage.description}</p>
						{/if}

						<!-- Counts -->
						<div class="stage-counts">
							{#if stage.material_count > 0}
								<span class="count-chip">📖 {stage.material_count} Materi</span>
							{/if}
							{#if stage.case_count > 0}
								<span class="count-chip">🔍 {stage.case_count} Studi Kasus</span>
							{/if}
							{#if stage.quiz_count > 0}
								<span class="count-chip">✏️ {stage.quiz_count} Kuis</span>
							{/if}
							{#if stage.estimated_min}
								<span class="count-chip">⏱ ~{stage.estimated_min} menit</span>
							{/if}
						</div>

						<!-- Progress bar -->
						{#if stage.material_count > 0}
							<div class="stage-progress-wrap">
								<div class="stage-progress-bar">
									<div class="stage-progress-fill" style="width: {progressPercent(stage)}%"></div>
								</div>
								<span class="stage-progress-label">
									{stage.completed_material_count}/{stage.material_count} materi
								</span>
							</div>
						{/if}
					</div>

					<!-- Arrow -->
					<svg
						class="stage-arrow"
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						aria-hidden="true"
					>
						<polyline points="9 18 15 12 9 6" />
					</svg>
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

	.page-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.page-title {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0;
	}

	.page-subtitle {
		margin: 0.25rem 0 0;
		color: var(--color-muted);
		font-size: 0.9375rem;
	}

	.summary-badges {
		display: flex;
		gap: 0.75rem;
	}

	.summary-badge {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.625rem 1rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		min-width: 64px;
	}

	.summary-badge.highlight {
		background: color-mix(in srgb, var(--color-highlight) 12%, var(--color-surface));
		border-color: var(--color-highlight);
	}

	.summary-value {
		font-size: 1.375rem;
		font-weight: 700;
		color: var(--color-text);
		line-height: 1;
	}

	.summary-label {
		font-size: 0.6875rem;
		color: var(--color-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		margin-top: 0.25rem;
	}

	.overall-progress {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.overall-progress-bar {
		flex: 1;
		height: 8px;
		background: var(--color-border);
		border-radius: 999px;
		overflow: hidden;
	}

	.overall-progress-fill {
		height: 100%;
		background: var(--color-primary);
		border-radius: 999px;
		transition: width 0.4s ease;
	}

	.overall-progress-label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		white-space: nowrap;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--color-muted);
	}

	.stages-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.stage-card {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		padding: 1.25rem 1.375rem;
		background: var(--color-surface);
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-xl);
		text-decoration: none;
		color: inherit;
		transition:
			border-color 0.15s,
			box-shadow 0.15s,
			transform 0.15s;
	}

	.stage-card:hover {
		border-color: var(--color-secondary);
		box-shadow: 0 2px 12px rgba(28, 80, 167, 0.08);
		transform: translateY(-1px);
	}

	.stage-card.stage-completed {
		border-color: color-mix(in srgb, var(--color-success) 40%, transparent);
		background: color-mix(in srgb, var(--color-success-bg) 60%, var(--color-surface));
	}

	.stage-card.stage-in-progress {
		border-color: color-mix(in srgb, var(--color-primary) 30%, transparent);
	}

	.stage-number {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: var(--color-bg-subtle);
		color: var(--color-text-secondary);
		font-size: 1.125rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: background 0.15s;
	}

	.stage-completed .stage-number {
		background: var(--color-success);
		color: white;
	}

	.stage-in-progress .stage-number {
		background: var(--color-primary);
		color: white;
	}

	.stage-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.stage-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.stage-status-badge {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
	}

	.stage-status-badge.stage-completed {
		background: color-mix(in srgb, var(--color-success) 15%, transparent);
		color: color-mix(in srgb, var(--color-success) 80%, black);
	}

	.stage-status-badge.stage-in-progress {
		background: color-mix(in srgb, var(--color-primary) 12%, transparent);
		color: var(--color-primary);
	}

	.stage-status-badge.stage-not-started {
		background: var(--color-bg-subtle);
		color: var(--color-muted);
	}

	.stage-points {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-highlight-dark);
		background: color-mix(in srgb, var(--color-highlight) 15%, transparent);
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
	}

	.stage-title {
		font-size: 1.0625rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0;
	}

	.stage-description {
		font-size: 0.875rem;
		color: var(--color-muted);
		margin: 0;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		line-clamp: 2;
	}

	.stage-counts {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.count-chip {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		background: var(--color-bg-subtle);
		padding: 0.125rem 0.5rem;
		border-radius: var(--radius-sm);
	}

	.stage-progress-wrap {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.125rem;
	}

	.stage-progress-bar {
		flex: 1;
		height: 5px;
		background: var(--color-border);
		border-radius: 999px;
		overflow: hidden;
	}

	.stage-progress-fill {
		height: 100%;
		background: var(--color-primary);
		border-radius: 999px;
		transition: width 0.3s;
	}

	.stage-completed .stage-progress-fill {
		background: var(--color-success);
	}

	.stage-progress-label {
		font-size: 0.75rem;
		color: var(--color-muted);
		white-space: nowrap;
	}

	.stage-arrow {
		flex-shrink: 0;
		color: var(--color-muted);
		transition:
			transform 0.15s,
			color 0.15s;
	}

	.stage-card:hover .stage-arrow {
		transform: translateX(2px);
		color: var(--color-primary);
	}
</style>
