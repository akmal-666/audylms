<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
	const game = $derived(data.game);
	const items = $derived(data.items);
	let submitting = $state(false);
	const result = $derived(form?.result ?? null);
</script>

<svelte:head><title>{game.title} — Play & Learn</title></svelte:head>
<div class="page">
	<nav class="breadcrumb">
		<a href="/play-learn">Play & Learn</a>
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg
		> <span>{game.title}</span>
	</nav>
	<header class="game-header">
		<h1 class="game-title">🎮 {game.title}</h1>
		{#if game.description}<p class="game-desc">{game.description}</p>{/if}
		<div class="game-meta">
			<span>Nilai lulus: {game.passing_score}%</span>
			{#if game.points_reward > 0}<span>⭐ {game.points_reward} poin jika lulus</span>{/if}
		</div>
	</header>

	{#if result}
		<div class="result-card" class:passed={result.passed} class:failed={!result.passed}>
			<div class="result-score">{result.score}%</div>
			<div class="result-label">{result.passed ? '🎉 Lulus!' : '❌ Belum Lulus'}</div>
			{#if result.points_earned > 0}<div class="result-pts">
					+{result.points_earned} poin diperoleh!
				</div>{/if}
		</div>
		<a href="/play-learn" class="btn-back">← Kembali</a>
	{:else}
		<form
			method="POST"
			action="?/submit"
			class="game-form"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					submitting = false;
					await update();
				};
			}}
		>
			<div class="items-list">
				{#each items as item, i (item.id)}
					<div class="item-card">
						<div class="item-num">{i + 1}</div>
						<div class="item-body">
							{#if item.drive_file}
								<div class="item-media">
									{#if (item.drive_file as { mime_type: string }).mime_type.startsWith('image/')}
										<img
											src="/api/files/{item.drive_file.id}/stream"
											alt="Media pertanyaan"
											class="item-img"
											loading="lazy"
										/>
									{:else if (item.drive_file as { mime_type: string }).mime_type.startsWith('video/')}
										<video controls preload="metadata" class="item-video">
											<source
												src="/api/files/{item.drive_file.id}/stream"
												type={(item.drive_file as { mime_type: string }).mime_type}
											/>
										</video>
									{:else}
										<a
											href="/api/files/{item.drive_file.id}/stream"
											target="_blank"
											rel="noopener noreferrer"
											class="item-doc-link">📎 {(item.drive_file as { name: string }).name}</a
										>
									{/if}
								</div>
							{/if}
							<p class="item-prompt">{item.prompt}</p>
							{#if Array.isArray(item.options)}
								<ul class="options-list" role="radiogroup">
									{#each item.options as opt (opt)}
										<li>
											<label class="option-label">
												<input type="radio" name="item_{item.id}" value={opt} required />
												<span>{opt}</span>
											</label>
										</li>
									{/each}
								</ul>
							{:else}
								<input
									type="text"
									name="item_{item.id}"
									class="free-input"
									placeholder="Jawaban Anda…"
									required
								/>
							{/if}
						</div>
					</div>
				{/each}
			</div>
			<div class="submit-row">
				<button type="submit" class="btn-submit" disabled={submitting}
					>{submitting ? 'Mengirim…' : 'Kirim Jawaban'}</button
				>
				<a href="/play-learn" class="btn-back">Batal</a>
			</div>
		</form>
	{/if}
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
	.game-header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.game-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0;
	}
	.game-desc {
		margin: 0;
		color: var(--color-text-secondary);
	}
	.game-meta {
		display: flex;
		gap: 0.75rem;
		font-size: 0.8125rem;
		color: var(--color-muted);
	}
	.result-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 2rem;
		background: var(--color-surface);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-xl);
		text-align: center;
	}
	.result-card.passed {
		border-color: var(--color-success);
		background: var(--color-success-bg);
	}
	.result-card.failed {
		border-color: var(--color-error);
		background: var(--color-error-bg);
	}
	.result-score {
		font-size: 3.5rem;
		font-weight: 800;
		line-height: 1;
	}
	.result-label {
		font-size: 1.375rem;
		font-weight: 700;
	}
	.result-pts {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-highlight-dark, #e09520);
	}
	.game-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.items-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.item-card {
		display: flex;
		gap: 1rem;
		padding: 1.125rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}
	.item-num {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--color-bg-subtle);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.8125rem;
		font-weight: 700;
		flex-shrink: 0;
		color: var(--color-primary);
	}
	.item-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.item-media {
		display: contents;
	}
	.item-img {
		max-width: 100%;
		border-radius: var(--radius-md);
	}
	.item-video {
		width: 100%;
		border-radius: var(--radius-md);
	}
	.item-doc-link {
		font-size: 0.875rem;
		color: var(--color-primary);
		text-decoration: underline;
	}
	.item-prompt {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
	}
	.options-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.option-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		padding: 0.375rem 0.625rem;
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		font-size: 0.9rem;
	}
	.option-label:hover {
		background: var(--color-bg-subtle);
	}
	.free-input {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: 0.9375rem;
		font-family: var(--font-sans);
		outline: none;
	}
	.free-input:focus {
		border-color: var(--color-primary);
	}
	.submit-row {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	.btn-submit {
		padding: 0.625rem 1.5rem;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-md);
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
	}
	.btn-submit:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.btn-back {
		font-size: 0.875rem;
		color: var(--color-muted);
		text-decoration: none;
	}
</style>
