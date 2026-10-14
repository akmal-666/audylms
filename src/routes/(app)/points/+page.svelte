<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const summary = $derived(data.summary);

	const EVENT_LABELS: Record<string, string> = {
		MATERIAL_COMPLETE: 'Materi selesai',
		CASE_COMPLETE: 'Studi kasus selesai',
		QUIZ_PASS: 'Kuis lulus',
		QUIZ_PERFECT: 'Skor sempurna!',
		QUESTION_CORRECT: 'Jawaban benar',
		VERIFIED_ANSWER: 'Jawaban terverifikasi',
		GAME_COMPLETE: 'Game selesai',
		STREAK_BONUS: 'Streak bonus',
		MANUAL_AWARD: 'Poin dari admin',
		MANUAL_DEDUCT: 'Pengurangan poin'
	};
</script>

<svelte:head>
	<title>Poin Saya — Audy Learning Centre</title>
</svelte:head>

<div class="page">
	<!-- Header -->
	<div class="page-header">
		<h1 class="page-title">⭐ Poin Saya</h1>
		<p class="page-subtitle">Kumpulkan poin dengan menyelesaikan pembelajaran.</p>
	</div>

	<!-- Balance + Level card -->
	<div class="summary-card">
		<div class="balance-section">
			<div class="balance-value">{summary.total_points.toLocaleString('id-ID')}</div>
			<div class="balance-label">Total Poin</div>
		</div>

		{#if summary.current_level}
			<div class="level-section">
				<div class="level-icon">{summary.current_level.icon ?? '⭐'}</div>
				<div class="level-info">
					<span class="level-name">{summary.current_level.label}</span>
					<span class="level-sub">Level {summary.current_level.level_number}</span>
				</div>
			</div>
		{/if}

		<!-- Progress to next level -->
		{#if summary.next_level}
			<div class="next-level-section">
				<div class="next-level-header">
					<span class="next-label">Menuju {summary.next_level.label}</span>
					<span class="next-pts"
						>{summary.next_level.points_required - summary.total_points} poin lagi</span
					>
				</div>
				<div class="level-bar">
					<div class="level-fill" style="width:{summary.progress_to_next}%"></div>
				</div>
				<div class="level-range">
					<span>{summary.current_level?.points_required ?? 0}</span>
					<span>{summary.next_level.points_required}</span>
				</div>
			</div>
		{:else if summary.current_level}
			<div class="max-level">
				<span>🏆 Level Tertinggi Tercapai!</span>
			</div>
		{/if}
	</div>

	<!-- Recent transactions -->
	<section class="history-section">
		<h2 class="section-title">Riwayat Poin</h2>
		{#if summary.recent_history.length === 0}
			<p class="empty">Belum ada transaksi poin.</p>
		{:else}
			<ul class="tx-list">
				{#each summary.recent_history as tx (tx.id)}
					<li class="tx-row">
						<div class="tx-icon" class:positive={tx.points > 0} class:negative={tx.points < 0}>
							{tx.points > 0 ? '+' : ''}{tx.points}
						</div>
						<div class="tx-info">
							<span class="tx-label">{EVENT_LABELS[tx.event_type] ?? tx.event_type}</span>
							{#if tx.notes}
								<span class="tx-notes">{tx.notes}</span>
							{/if}
						</div>
						<div class="tx-date">
							{new Date(tx.created_at).toLocaleDateString('id-ID', {
								day: 'numeric',
								month: 'short'
							})}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>

<style>
	.page {
		max-width: 640px;
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

	.summary-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
		padding: 1.75rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.balance-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem 0;
	}
	.balance-value {
		font-size: 3.5rem;
		font-weight: 800;
		color: var(--color-highlight-dark, var(--color-highlight));
		line-height: 1;
	}
	.balance-label {
		font-size: 0.875rem;
		color: var(--color-muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.level-section {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		padding: 0.75rem 1rem;
		background: color-mix(in srgb, var(--color-primary) 6%, transparent);
		border-radius: var(--radius-lg);
	}
	.level-icon {
		font-size: 1.75rem;
	}
	.level-info {
		display: flex;
		flex-direction: column;
	}
	.level-name {
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-text);
	}
	.level-sub {
		font-size: 0.8125rem;
		color: var(--color-muted);
	}

	.next-level-section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.next-level-header {
		display: flex;
		justify-content: space-between;
		font-size: 0.8125rem;
	}
	.next-label {
		color: var(--color-text-secondary);
		font-weight: 500;
	}
	.next-pts {
		color: var(--color-primary);
		font-weight: 600;
	}
	.level-bar {
		height: 8px;
		background: var(--color-border);
		border-radius: 999px;
		overflow: hidden;
	}
	.level-fill {
		height: 100%;
		background: var(--color-highlight);
		border-radius: 999px;
		transition: width 0.4s;
	}
	.level-range {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
		color: var(--color-placeholder);
	}
	.max-level {
		text-align: center;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-highlight-dark, #e09520);
	}

	.history-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.section-title {
		font-size: 1rem;
		font-weight: 700;
		margin: 0;
	}
	.empty {
		color: var(--color-muted);
		font-style: italic;
	}
	.tx-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}
	.tx-row {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface);
	}
	.tx-row:last-child {
		border-bottom: none;
	}
	.tx-icon {
		font-size: 0.9375rem;
		font-weight: 700;
		min-width: 44px;
		text-align: center;
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius-sm);
	}
	.tx-icon.positive {
		background: color-mix(in srgb, var(--color-success) 12%, transparent);
		color: color-mix(in srgb, var(--color-success) 80%, black);
	}
	.tx-icon.negative {
		background: color-mix(in srgb, var(--color-error) 12%, transparent);
		color: var(--color-error);
	}
	.tx-info {
		flex: 1;
		display: flex;
		flex-direction: column;
	}
	.tx-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text);
	}
	.tx-notes {
		font-size: 0.75rem;
		color: var(--color-muted);
	}
	.tx-date {
		font-size: 0.75rem;
		color: var(--color-placeholder);
		flex-shrink: 0;
	}
</style>
