<script lang="ts">
	import type { PageData } from './$types';
	import type { MaterialWithContent } from '$lib/types/growth-journey.types';
	import type { Tables } from '$lib/types/database.types';

	let { data }: { data: PageData } = $props();

	const stage = $derived(data.stage);

	// Active tab
	let activeTab = $state<'overview' | 'materi' | 'kasus' | 'kuis' | 'lampiran'>('overview');

	// Material progress map from loaded data
	const matProgressMap = $derived(
		new Map(
			stage.material_progresses.map((p: Tables<'gj_material_progress'>) => [
				p.material_id,
				p.status
			])
		)
	);

	// "Continue Learning" — first required incomplete material
	const continueMaterial = $derived(
		stage.materials.find(
			(m: MaterialWithContent) => m.is_required && matProgressMap.get(m.id) !== 'COMPLETED'
		) ?? null
	);

	// Stage progress percent
	const progressPercent = $derived(() => {
		const total = stage.materials.filter((m: MaterialWithContent) => m.is_required).length;
		if (total === 0) return 100;
		const done = stage.material_progresses.filter(
			(p: Tables<'gj_material_progress'>) => p.status === 'COMPLETED'
		).length;
		return Math.round((done / total) * 100);
	});

	// Attachment count across all materials
	const attachmentCount = $derived(
		stage.materials.reduce((sum: number, m: MaterialWithContent) => sum + m.attachments.length, 0)
	);
</script>

<svelte:head>
	<title>{stage.title} — Growth Journey — ALC</title>
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
		<span aria-current="page">Stage {stage.stage_number}</span>
	</nav>

	<!-- Stage header card -->
	<div class="stage-header">
		<div class="stage-header-top">
			<div class="stage-number-badge">Stage {stage.stage_number}</div>
			{#if stage.points_reward > 0}
				<span class="points-badge">+{stage.points_reward} poin</span>
			{/if}
		</div>

		<h1 class="stage-title">{stage.title}</h1>
		{#if stage.description}
			<p class="stage-description">{stage.description}</p>
		{/if}

		<div class="stage-meta-row">
			{#if stage.estimated_min}
				<span class="meta-item">⏱ ~{stage.estimated_min} menit</span>
			{/if}
			{#if stage.user_progress?.status}
				<span class="meta-item status-{stage.user_progress.status.toLowerCase()}">
					{stage.user_progress.status === 'COMPLETED'
						? '✅ Selesai'
						: stage.user_progress.status === 'IN_PROGRESS'
							? '🔄 Sedang Berjalan'
							: '⬜ Belum Dimulai'}
				</span>
			{/if}
		</div>

		<!-- Progress -->
		<div class="progress-section">
			<div class="progress-bar">
				<div class="progress-fill" style="width:{progressPercent()}%"></div>
			</div>
			<span class="progress-label">{progressPercent()}% selesai</span>
		</div>

		<!-- Continue button -->
		{#if continueMaterial && stage.user_progress?.status !== 'COMPLETED'}
			<a href="/growth-journey/{stage.id}/material/{continueMaterial.id}" class="btn-continue">
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3" /></svg
				>
				Lanjutkan Belajar
			</a>
		{:else if stage.user_progress?.status === 'COMPLETED'}
			<div class="completed-badge">
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg
				>
				Stage Selesai!
			</div>
		{/if}
	</div>

	<!-- Tabs -->
	<div class="tabs" role="tablist" aria-label="Konten stage">
		{#each [{ key: 'overview', label: 'Overview', count: null }, { key: 'materi', label: 'Materi', count: stage.materials.length }, { key: 'kasus', label: 'Studi Kasus', count: stage.cases.length }, { key: 'kuis', label: 'Kuis', count: stage.quizzes.length }, { key: 'lampiran', label: 'Lampiran', count: attachmentCount }] as tab (tab.key)}
			<button
				class="tab-btn"
				class:active={activeTab === tab.key}
				role="tab"
				aria-selected={activeTab === tab.key}
				onclick={() => (activeTab = tab.key as typeof activeTab)}
			>
				{tab.label}
				{#if tab.count !== null && tab.count > 0}
					<span class="tab-count">{tab.count}</span>
				{/if}
			</button>
		{/each}
	</div>

	<!-- Tab content -->
	<div class="tab-content">
		{#if activeTab === 'overview'}
			<div class="overview-grid">
				<div class="overview-card">
					<span class="overview-icon">📖</span>
					<span class="overview-value">{stage.materials.length}</span>
					<span class="overview-label">Materi</span>
				</div>
				<div class="overview-card">
					<span class="overview-icon">🔍</span>
					<span class="overview-value">{stage.cases.length}</span>
					<span class="overview-label">Studi Kasus</span>
				</div>
				<div class="overview-card">
					<span class="overview-icon">✏️</span>
					<span class="overview-value">{stage.quizzes.length}</span>
					<span class="overview-label">Kuis</span>
				</div>
				<div class="overview-card">
					<span class="overview-icon">📎</span>
					<span class="overview-value">{attachmentCount}</span>
					<span class="overview-label">Lampiran</span>
				</div>
			</div>
		{:else if activeTab === 'materi'}
			{#if stage.materials.length === 0}
				<p class="empty">Belum ada materi.</p>
			{:else}
				<ul class="item-list">
					{#each stage.materials as mat, idx (mat.id)}
						{@const status = matProgressMap.get(mat.id)}
						<li class="item-row" class:item-done={status === 'COMPLETED'}>
							<div class="item-num">{idx + 1}</div>
							<div class="item-info">
								<a href="/growth-journey/{stage.id}/material/{mat.id}" class="item-title">
									{mat.title}
								</a>
								{#if mat.summary}
									<p class="item-summary">{mat.summary}</p>
								{/if}
								<div class="item-meta">
									{#if mat.estimated_min}<span>⏱ {mat.estimated_min} menit</span>{/if}
									{#if mat.is_required}<span class="required-tag">Wajib</span>{/if}
								</div>
							</div>
							<div class="item-status">
								{#if status === 'COMPLETED'}
									<span class="status-dot completed">✓</span>
								{:else if status === 'IN_PROGRESS'}
									<span class="status-dot in-progress">↻</span>
								{:else}
									<span class="status-dot not-started">○</span>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		{:else if activeTab === 'kasus'}
			{#if stage.cases.length === 0}
				<p class="empty">Belum ada studi kasus.</p>
			{:else}
				<ul class="item-list">
					{#each stage.cases as c (c.id)}
						<li class="item-row">
							<div class="item-info" style="padding-left:0">
								<span class="item-title">{c.title}</span>
								{#if c.description}<p class="item-summary">{c.description}</p>{/if}
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		{:else if activeTab === 'kuis'}
			{#if stage.quizzes.length === 0}
				<p class="empty">Belum ada kuis.</p>
			{:else}
				<ul class="item-list">
					{#each stage.quizzes as qz (qz.id)}
						{@const bestAttempt =
							stage.quiz_attempts
								.filter((a: Tables<'gj_quiz_attempts'>) => a.quiz_id === qz.id)
								.sort(
									(a: Tables<'gj_quiz_attempts'>, b: Tables<'gj_quiz_attempts'>) =>
										(b.score ?? 0) - (a.score ?? 0)
								)[0] ?? null}
						<li class="item-row">
							<div class="item-info" style="padding-left:0">
								<a href="/growth-journey/{stage.id}/quiz/{qz.id}" class="item-title">{qz.title}</a>
								<div class="item-meta">
									<span>Nilai lulus: {qz.passing_score}%</span>
									{#if qz.time_limit_min}<span>⏱ {qz.time_limit_min} menit</span>{/if}
									{#if bestAttempt}
										<span
											class:text-success={bestAttempt.passed}
											class:text-error={!bestAttempt.passed}
										>
											Nilai terbaik: {bestAttempt.score}%
										</span>
									{/if}
								</div>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		{:else if activeTab === 'lampiran'}
			{@const allAttachments = stage.materials.flatMap((m: MaterialWithContent) =>
				m.attachments.map(
					(a: Tables<'gj_attachments'> & { drive_file: Tables<'drive_files'> }) => ({
						...a,
						material_title: m.title
					})
				)
			)}
			{#if allAttachments.length === 0}
				<p class="empty">Belum ada lampiran.</p>
			{:else}
				<ul class="attachment-list">
					{#each allAttachments as att (att.id)}
						<li class="attachment-row">
							<div class="attachment-icon">
								{att.attachment_type === 'IMAGE'
									? '🖼️'
									: att.attachment_type === 'VIDEO'
										? '🎬'
										: att.attachment_type === 'PDF'
											? '📄'
											: '📎'}
							</div>
							<div class="attachment-info">
								<span class="attachment-name"
									>{att.display_name ?? att.drive_file?.name ?? 'File'}</span
								>
								<span class="attachment-meta">{att.material_title}</span>
							</div>
							{#if att.drive_file?.web_view_url}
								<a
									href="/api/files/{att.drive_file.id}/stream"
									target="_blank"
									rel="noopener noreferrer"
									class="attachment-btn"
								>
									Buka
								</a>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		{/if}
	</div>
</div>

<style>
	.page {
		max-width: 800px;
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
	.breadcrumb a:hover {
		text-decoration: underline;
	}

	.stage-header {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.stage-header-top {
		display: flex;
		align-items: center;
		gap: 0.625rem;
	}
	.stage-number-badge {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 10%, transparent);
		padding: 0.25rem 0.625rem;
		border-radius: 999px;
	}
	.points-badge {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-highlight-dark);
		background: color-mix(in srgb, var(--color-highlight) 15%, transparent);
		padding: 0.25rem 0.625rem;
		border-radius: 999px;
	}

	.stage-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0;
	}
	.stage-description {
		margin: 0;
		color: var(--color-text-secondary);
		font-size: 0.9375rem;
		line-height: 1.6;
	}

	.stage-meta-row {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	.meta-item {
		font-size: 0.8125rem;
		color: var(--color-muted);
	}

	.progress-section {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.progress-bar {
		flex: 1;
		height: 8px;
		background: var(--color-border);
		border-radius: 999px;
		overflow: hidden;
	}
	.progress-fill {
		height: 100%;
		background: var(--color-primary);
		border-radius: 999px;
		transition: width 0.4s;
	}
	.progress-label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		white-space: nowrap;
	}

	.btn-continue {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1.25rem;
		background: var(--color-primary);
		color: white;
		border-radius: var(--radius-md);
		font-size: 0.9375rem;
		font-weight: 600;
		text-decoration: none;
		width: fit-content;
		transition: background 0.15s;
	}
	.btn-continue:hover {
		background: var(--color-primary-light);
	}

	.completed-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 1rem;
		background: color-mix(in srgb, var(--color-success) 12%, transparent);
		color: color-mix(in srgb, var(--color-success) 80%, black);
		border-radius: var(--radius-md);
		font-size: 0.9rem;
		font-weight: 600;
	}

	.tabs {
		display: flex;
		gap: 0;
		border-bottom: 2px solid var(--color-border);
		overflow-x: auto;
	}
	.tab-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.625rem 1rem;
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		margin-bottom: -2px;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-muted);
		cursor: pointer;
		white-space: nowrap;
		transition:
			color 0.1s,
			border-color 0.1s;
	}
	.tab-btn:hover {
		color: var(--color-text);
	}
	.tab-btn.active {
		color: var(--color-primary);
		border-bottom-color: var(--color-primary);
		font-weight: 600;
	}
	.tab-count {
		font-size: 0.6875rem;
		font-weight: 700;
		background: var(--color-bg-subtle);
		color: var(--color-text-secondary);
		padding: 0.0625rem 0.375rem;
		border-radius: 999px;
	}

	.tab-content {
		min-height: 200px;
	}
	.empty {
		color: var(--color-muted);
		font-style: italic;
		padding: 2rem 0;
	}

	.overview-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 1rem;
	}
	.overview-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.25rem 1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.375rem;
	}
	.overview-icon {
		font-size: 1.5rem;
	}
	.overview-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-text);
	}
	.overview-label {
		font-size: 0.75rem;
		color: var(--color-muted);
		text-align: center;
	}

	.item-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0;
	}
	.item-row {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 0.875rem 0;
		border-bottom: 1px solid var(--color-border);
	}
	.item-row:last-child {
		border-bottom: none;
	}
	.item-row.item-done .item-title {
		color: var(--color-muted);
	}

	.item-num {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--color-bg-subtle);
		color: var(--color-text-secondary);
		font-size: 0.8125rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-top: 0.125rem;
	}
	.item-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.item-title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-text);
		text-decoration: none;
	}
	a.item-title:hover {
		color: var(--color-primary);
		text-decoration: underline;
	}
	.item-summary {
		font-size: 0.8125rem;
		color: var(--color-muted);
		margin: 0;
	}
	.item-meta {
		display: flex;
		gap: 0.625rem;
		flex-wrap: wrap;
		font-size: 0.75rem;
		color: var(--color-muted);
	}
	.required-tag {
		color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 10%, transparent);
		padding: 0.0625rem 0.375rem;
		border-radius: 999px;
		font-weight: 600;
	}

	.item-status {
		flex-shrink: 0;
		padding-top: 0.125rem;
	}
	.status-dot {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.875rem;
		font-weight: 700;
	}
	.status-dot.completed {
		background: color-mix(in srgb, var(--color-success) 15%, transparent);
		color: var(--color-success);
	}
	.status-dot.in-progress {
		background: color-mix(in srgb, var(--color-primary) 12%, transparent);
		color: var(--color-primary);
	}
	.status-dot.not-started {
		background: var(--color-bg-subtle);
		color: var(--color-border-strong);
	}

	.text-success {
		color: var(--color-success);
	}
	.text-error {
		color: var(--color-error);
	}

	.attachment-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0;
	}
	.attachment-row {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--color-border);
	}
	.attachment-row:last-child {
		border-bottom: none;
	}
	.attachment-icon {
		font-size: 1.375rem;
		flex-shrink: 0;
	}
	.attachment-info {
		flex: 1;
		min-width: 0;
	}
	.attachment-name {
		display: block;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-text);
	}
	.attachment-meta {
		font-size: 0.75rem;
		color: var(--color-muted);
	}
	.attachment-btn {
		flex-shrink: 0;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 10%, transparent);
		padding: 0.25rem 0.75rem;
		border-radius: var(--radius-sm);
		text-decoration: none;
	}
	.attachment-btn:hover {
		background: color-mix(in srgb, var(--color-primary) 18%, transparent);
	}
</style>
