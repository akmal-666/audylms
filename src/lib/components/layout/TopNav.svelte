<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import type { UserProfile } from '$lib/types/auth.types';

	let {
		user,
		onMenuToggle
	}: {
		user: UserProfile | null;
		onMenuToggle: () => void;
	} = $props();

	let userMenuOpen = $state(false);

	// Close menu on outside click
	function handleOutsideClick(e: MouseEvent) {
		const target = e.target as Element;
		if (!target.closest('.user-menu-wrapper')) {
			userMenuOpen = false;
		}
	}

	// Get page title from pathname
	const pageTitle = $derived(() => {
		const path = $page.url.pathname;
		const titles: Record<string, string> = {
			'/dashboard': 'Dashboard',
			'/growth-journey': 'Growth Journey',
			'/product-knowledge': 'Product Knowledge',
			'/play-learn': 'Play & Learn',
			'/tanya-jawab': 'Tanya Jawab',
			'/lets-practice': "Let's Practice",
			'/fresh-update': 'Fresh Update',
			'/points': 'Poin Saya',
			'/badges': 'Lencana',
			'/certificates': 'Sertifikat',
			'/team': 'Tim & Progres',
			'/settings': 'Pengaturan',
			'/audit-logs': 'Audit Log'
		};
		const key = Object.keys(titles).find((k) => path.startsWith(k));
		return key ? titles[key] : 'Audy Learning Centre';
	});
</script>

<svelte:window onclick={handleOutsideClick} />

<header class="topnav">
	<!-- Mobile menu button -->
	<button class="menu-btn" onclick={onMenuToggle} aria-label="Buka menu navigasi">
		<svg
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			aria-hidden="true"
		>
			<line x1="3" y1="12" x2="21" y2="12" />
			<line x1="3" y1="6" x2="21" y2="6" />
			<line x1="3" y1="18" x2="21" y2="18" />
		</svg>
	</button>

	<h1 class="page-title">{pageTitle()}</h1>

	<!-- User menu -->
	<div class="user-menu-wrapper">
		<button
			class="user-btn"
			onclick={() => (userMenuOpen = !userMenuOpen)}
			aria-expanded={userMenuOpen}
			aria-haspopup="true"
			aria-label="Menu pengguna"
		>
			<div class="user-avatar" aria-hidden="true">
				{user?.full_name?.[0]?.toUpperCase() ?? '?'}
			</div>
			<span class="user-name-desktop">{user?.full_name ?? 'Pengguna'}</span>
			<svg
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				class="chevron"
				class:chevron--open={userMenuOpen}
				aria-hidden="true"
			>
				<polyline points="6 9 12 15 18 9" />
			</svg>
		</button>

		{#if userMenuOpen}
			<div class="dropdown" role="menu">
				<div class="dropdown-header">
					<span class="dropdown-name">{user?.full_name}</span>
					<span class="dropdown-email">{user?.email}</span>
				</div>
				<hr class="dropdown-divider" />
				<form method="POST" action="/logout" use:enhance>
					<button type="submit" class="dropdown-item dropdown-item--danger" role="menuitem">
						<svg
							width="15"
							height="15"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							aria-hidden="true"
						>
							<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
							<polyline points="16 17 21 12 16 7" />
							<line x1="21" y1="12" x2="9" y2="12" />
						</svg>
						Keluar
					</button>
				</form>
			</div>
		{/if}
	</div>
</header>

<style>
	.topnav {
		height: 60px;
		background: var(--color-surface);
		border-bottom: 1px solid var(--color-border);
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0 1.25rem;
		position: sticky;
		top: 0;
		z-index: 20;
	}

	.menu-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.375rem;
		color: var(--color-text-secondary);
		border-radius: var(--radius-md);
		display: flex;
		align-items: center;
	}

	.menu-btn:hover {
		background: var(--color-bg);
		color: var(--color-text);
	}

	@media (min-width: 1024px) {
		.menu-btn {
			display: none;
		}
	}

	.page-title {
		flex: 1;
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.user-menu-wrapper {
		position: relative;
	}

	.user-btn {
		background: none;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.625rem;
		border-radius: var(--radius-md);
		transition: background-color 0.1s;
	}

	.user-btn:hover {
		background: var(--color-bg);
	}

	.user-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: color-mix(in srgb, var(--color-primary) 15%, var(--color-secondary));
		color: var(--color-primary-dark);
		font-size: 0.8125rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.user-name-desktop {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text);
		display: none;
	}

	@media (min-width: 640px) {
		.user-name-desktop {
			display: block;
		}
	}

	.chevron {
		color: var(--color-muted);
		transition: transform 0.15s;
	}

	.chevron--open {
		transform: rotate(180deg);
	}

	.dropdown {
		position: absolute;
		right: 0;
		top: calc(100% + 0.5rem);
		min-width: 220px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
		z-index: 50;
		overflow: hidden;
	}

	.dropdown-header {
		padding: 0.875rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.dropdown-name {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.dropdown-email {
		font-size: 0.8125rem;
		color: var(--color-muted);
	}

	.dropdown-divider {
		border: none;
		border-top: 1px solid var(--color-border);
		margin: 0;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		width: 100%;
		padding: 0.75rem 1rem;
		background: none;
		border: none;
		font-size: 0.875rem;
		font-family: var(--font-sans);
		cursor: pointer;
		text-align: left;
		color: var(--color-text-secondary);
		transition: background-color 0.1s;
	}

	.dropdown-item:hover {
		background: var(--color-bg);
	}

	.dropdown-item--danger {
		color: var(--color-error);
	}

	.dropdown-item--danger:hover {
		background: var(--color-error-bg);
	}
</style>
