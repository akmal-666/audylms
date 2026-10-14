<script lang="ts">
	import type { PageData } from './$types';
	import { ROLE_LABELS, POSITION_LABELS } from '$lib/types/auth.types';

	let { data }: { data: PageData } = $props();

	const user = $derived(data.user);
	const greeting = $derived(() => {
		const hour = new Date().getHours();
		if (hour < 12) return 'Selamat pagi';
		if (hour < 15) return 'Selamat siang';
		if (hour < 18) return 'Selamat sore';
		return 'Selamat malam';
	});

	const modules = [
		{
			slug: 'growth-journey',
			label: 'Growth Journey',
			icon: '🌱',
			description: 'Jalur pembelajaran terstruktur'
		},
		{
			slug: 'product-knowledge',
			label: 'Product Knowledge',
			icon: '💡',
			description: 'Pengetahuan produk klinik'
		},
		{
			slug: 'play-learn',
			label: 'Play & Learn',
			icon: '🎮',
			description: 'Belajar dengan permainan'
		},
		{ slug: 'tanya-jawab', label: 'Tanya Jawab', icon: '💬', description: 'Forum diskusi dan Q&A' },
		{
			slug: 'lets-practice',
			label: "Let's Practice",
			icon: '📝',
			description: 'Latihan dan penilaian'
		},
		{ slug: 'fresh-update', label: 'Fresh Update', icon: '📰', description: 'Info terbaru klinik' }
	];
</script>

<svelte:head>
	<title>Dashboard — Audy Learning Centre</title>
</svelte:head>

<div class="page">
	<!-- Welcome header -->
	<header class="page-header">
		<div class="welcome">
			<h1 class="welcome-greeting">
				{greeting()}, {user?.full_name?.split(' ')[0] ?? 'Pengguna'} 👋
			</h1>
			<p class="welcome-sub">Selamat datang di Audy Learning Centre.</p>
		</div>
		<div class="user-badges">
			{#if user?.role}
				<span class="badge badge-role">{ROLE_LABELS[user.role]}</span>
			{/if}
			{#if user?.position?.name}
				<span class="badge badge-position">{POSITION_LABELS[user.position.name]}</span>
			{/if}
		</div>
	</header>

	<!-- Module cards -->
	<section class="modules-section">
		<h2 class="section-title">Modul Pembelajaran</h2>
		<div class="modules-grid">
			{#each modules as mod (mod.slug)}
				<a href="/{mod.slug}" class="module-card">
					<span class="module-icon" aria-hidden="true">{mod.icon}</span>
					<div class="module-info">
						<span class="module-name">{mod.label}</span>
						<span class="module-desc">{mod.description}</span>
					</div>
					<svg
						class="module-arrow"
						width="16"
						height="16"
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
	</section>
</div>

<style>
	.page {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.page-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.welcome-greeting {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0;
	}

	.welcome-sub {
		margin: 0.25rem 0 0;
		color: var(--color-muted);
		font-size: 0.9375rem;
	}

	.user-badges {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.75rem;
		border-radius: 999px;
		font-size: 0.8125rem;
		font-weight: 500;
	}

	.badge-role {
		background: color-mix(in srgb, var(--color-primary) 12%, transparent);
		color: var(--color-primary);
	}

	.badge-position {
		background: color-mix(in srgb, var(--color-secondary) 25%, transparent);
		color: var(--color-primary-dark);
	}

	.section-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 1rem;
	}

	.modules-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1rem;
	}

	.module-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.125rem 1.25rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		text-decoration: none;
		color: inherit;
		transition:
			border-color 0.15s,
			box-shadow 0.15s,
			transform 0.15s;
	}

	.module-card:hover {
		border-color: var(--color-secondary);
		box-shadow: 0 2px 8px rgba(28, 80, 167, 0.08);
		transform: translateY(-1px);
	}

	.module-icon {
		font-size: 1.75rem;
		flex-shrink: 0;
		line-height: 1;
	}

	.module-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.module-name {
		font-weight: 600;
		font-size: 0.9375rem;
		color: var(--color-text);
	}

	.module-desc {
		font-size: 0.8125rem;
		color: var(--color-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.module-arrow {
		flex-shrink: 0;
		color: var(--color-muted);
		transition:
			transform 0.15s,
			color 0.15s;
	}

	.module-card:hover .module-arrow {
		transform: translateX(2px);
		color: var(--color-primary);
	}
</style>
