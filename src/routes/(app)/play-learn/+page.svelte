<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	const games = $derived(data.games);
	const TYPE_LABELS: Record<string, string> = {
		FLASHCARD: 'Flashcard',
		MATCH_PAIRS: 'Cocokkan',
		FILL_BLANK: 'Isi Kosong',
		MULTIPLE_CHOICE: 'Pilihan Ganda',
		ORDERING: 'Urutan',
		DRAG_DROP: 'Seret & Lepas'
	};
</script>

<svelte:head><title>Play & Learn — ALC</title></svelte:head>
<div class="page">
	<header class="page-header">
		<h1 class="page-title">🎮 Play & Learn</h1>
		<p class="page-subtitle">Belajar sambil bermain dengan permainan interaktif.</p>
	</header>
	{#if games.length === 0}
		<p class="empty">Belum ada game yang tersedia.</p>
	{:else}
		<div class="games-grid">
			{#each games as game (game.id)}
				<a href="/play-learn/{game.id}" class="game-card">
					<div class="game-type">{TYPE_LABELS[game.game_type] ?? game.game_type}</div>
					<h2 class="game-title">{game.title}</h2>
					{#if game.description}<p class="game-desc">{game.description}</p>{/if}
					<div class="game-meta">
						<span>🏆 Lulus: {game.passing_score}%</span>
						{#if game.points_reward > 0}<span>⭐ {game.points_reward} poin</span>{/if}
					</div>
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
	.games-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 1rem;
	}
	.game-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1.25rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
		text-decoration: none;
		color: inherit;
		transition:
			border-color 0.15s,
			transform 0.15s;
	}
	.game-card:hover {
		border-color: var(--color-secondary);
		transform: translateY(-1px);
	}
	.game-type {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 10%, transparent);
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
		width: fit-content;
	}
	.game-title {
		font-size: 1.0625rem;
		font-weight: 700;
		margin: 0;
		color: var(--color-text);
	}
	.game-desc {
		font-size: 0.8125rem;
		color: var(--color-muted);
		margin: 0;
	}
	.game-meta {
		display: flex;
		gap: 0.625rem;
		font-size: 0.75rem;
		color: var(--color-muted);
		margin-top: 0.25rem;
	}
</style>
