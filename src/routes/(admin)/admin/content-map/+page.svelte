<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	const stages = $derived(
		data.stages as Array<{ id: string; sort_order: number; title: string; is_published: boolean }>
	);
	const pkCats = $derived(
		data.pk_categories as Array<{ id: string; title: string; is_published: boolean }>
	);
	const plGames = $derived(
		data.pl_games as Array<{ id: string; title: string; game_type: string; is_published: boolean }>
	);
	const lpPractices = $derived(
		data.lp_practices as Array<{
			id: string;
			title: string;
			resource_type: string;
			is_published: boolean;
		}>
	);
	const fuPosts = $derived(
		data.fu_posts as Array<{
			id: string;
			title: string;
			is_published: boolean;
			published_at: string | null;
		}>
	);
</script>

<svelte:head><title>Content Map — Admin ALC</title></svelte:head>
<div class="page">
	<h1 class="page-title">🗺️ Content Map</h1>
	<p class="page-subtitle">Peta seluruh konten ALC.</p>

	<div class="modules-grid">
		<section class="module-section">
			<h2 class="module-title">🌱 Growth Journey ({stages.length})</h2>
			<ul class="content-list">
				{#each stages as s (s.id)}
					<li class="content-item">
						<span class="stage-num">{s.sort_order}</span><a
							href="/admin/growth-journey/stages/{s.id}"
							class="content-link">{s.title}</a
						><span class="pub-chip" class:pub={s.is_published}
							>{s.is_published ? 'Aktif' : 'Draft'}</span
						>
					</li>
				{/each}
			</ul>
			<a href="/admin/growth-journey" class="module-link">Kelola →</a>
		</section>

		<section class="module-section">
			<h2 class="module-title">💡 Product Knowledge ({pkCats.length} kategori)</h2>
			<ul class="content-list">
				{#each pkCats as c (c.id)}
					<li class="content-item">
						<a href="/admin/product-knowledge" class="content-link">{c.title}</a><span
							class="pub-chip"
							class:pub={c.is_published}>{c.is_published ? 'Aktif' : 'Draft'}</span
						>
					</li>
				{/each}
			</ul>
			<a href="/admin/product-knowledge" class="module-link">Kelola →</a>
		</section>

		<section class="module-section">
			<h2 class="module-title">🎮 Play & Learn ({plGames.length} game)</h2>
			<ul class="content-list">
				{#each plGames as g (g.id)}
					<li class="content-item">
						<a href="/admin/play-learn/{g.id}" class="content-link">{g.title}</a><span
							class="type-tag">{g.game_type}</span
						><span class="pub-chip" class:pub={g.is_published}
							>{g.is_published ? 'Aktif' : 'Draft'}</span
						>
					</li>
				{/each}
			</ul>
			<a href="/admin/play-learn" class="module-link">Kelola →</a>
		</section>

		<section class="module-section">
			<h2 class="module-title">📝 Let's Practice ({lpPractices.length})</h2>
			<ul class="content-list">
				{#each lpPractices as p (p.id)}
					<li class="content-item">
						<a href="/admin/lets-practice" class="content-link">{p.title}</a><span class="type-tag"
							>{p.resource_type.replace('_', ' ')}</span
						><span class="pub-chip" class:pub={p.is_published}
							>{p.is_published ? 'Aktif' : 'Draft'}</span
						>
					</li>
				{/each}
			</ul>
		</section>

		<section class="module-section">
			<h2 class="module-title">📰 Fresh Update ({fuPosts.length} terbaru)</h2>
			<ul class="content-list">
				{#each fuPosts as p (p.id)}
					<li class="content-item">
						<a href="/admin/fresh-update/{p.id}" class="content-link">{p.title}</a><span
							class="pub-chip"
							class:pub={p.is_published}>{p.is_published ? 'Terbit' : 'Draft'}</span
						>
					</li>
				{/each}
			</ul>
			<a href="/admin/fresh-update/new" class="module-link">+ Artikel Baru</a>
		</section>
	</div>
</div>

<style>
	.page {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.page-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0;
	}
	.page-subtitle {
		color: var(--color-muted);
		margin: 0;
	}
	.modules-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
		gap: 1rem;
	}
	.module-section {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.module-title {
		font-size: 0.9375rem;
		font-weight: 700;
		margin: 0;
		color: var(--color-text);
	}
	.content-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.content-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0;
		font-size: 0.8125rem;
	}
	.stage-num {
		width: 20px;
		height: 20px;
		background: var(--color-bg-subtle);
		color: var(--color-muted);
		font-size: 0.7rem;
		font-weight: 700;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.content-link {
		flex: 1;
		color: var(--color-text);
		text-decoration: none;
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.content-link:hover {
		color: var(--color-primary);
	}
	.pub-chip {
		font-size: 0.6875rem;
		font-weight: 600;
		padding: 0.0625rem 0.375rem;
		border-radius: 999px;
		background: var(--color-bg-subtle);
		color: var(--color-muted);
		flex-shrink: 0;
	}
	.pub-chip.pub {
		background: color-mix(in srgb, var(--color-success) 12%, transparent);
		color: color-mix(in srgb, var(--color-success) 80%, black);
	}
	.type-tag {
		font-size: 0.6875rem;
		background: color-mix(in srgb, var(--color-primary) 8%, transparent);
		color: var(--color-primary);
		padding: 0.0625rem 0.375rem;
		border-radius: 999px;
		flex-shrink: 0;
		font-weight: 600;
	}
	.module-link {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: none;
		margin-top: auto;
	}
	.module-link:hover {
		text-decoration: underline;
	}
</style>
