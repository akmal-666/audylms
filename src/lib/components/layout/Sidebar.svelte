<script lang="ts">
	import { page } from '$app/stores';
	import type { UserProfile } from '$lib/types/auth.types';

	let {
		user,
		open = $bindable(false)
	}: {
		user: UserProfile | null;
		open: boolean;
	} = $props();

	const isAdmin = $derived(user?.role === 'ADMIN');

	const navItems = [
		{ href: '/dashboard', label: 'Dashboard', icon: 'grid' },
		{ href: '/growth-journey', label: 'Growth Journey', icon: 'trending-up' },
		{ href: '/product-knowledge', label: 'Product Knowledge', icon: 'book' },
		{ href: '/play-learn', label: 'Play & Learn', icon: 'play' },
		{ href: '/tanya-jawab', label: 'Tanya Jawab', icon: 'message-circle' },
		{ href: '/lets-practice', label: "Let's Practice", icon: 'edit' },
		{ href: '/fresh-update', label: 'Fresh Update', icon: 'rss' },
		{ href: '/ruang-aspirasi', label: 'Ruang Aspirasi', icon: 'heart' },
		{ href: '/notifications', label: 'Notifikasi', icon: 'bell' },
		{ href: '/points', label: 'Poin Saya', icon: 'star' },
		{ href: '/badges', label: 'Lencana', icon: 'award' },
		{ href: '/certificates', label: 'Sertifikat', icon: 'file-text' }
	];

	const adminItems = [
		{ href: '/admin/growth-journey', label: 'Growth Journey', icon: 'trending-up' },
		{ href: '/admin/product-knowledge', label: 'Product Knowledge', icon: 'book' },
		{ href: '/admin/play-learn', label: 'Play & Learn', icon: 'play' },
		{ href: '/admin/lets-practice', label: 'Lets Practice', icon: 'edit' },
		{ href: '/admin/fresh-update/new', label: 'Fresh Update', icon: 'rss' },
		{ href: '/admin/qna', label: 'Tanya Jawab', icon: 'message-circle' },
		{ href: '/admin/feedback', label: 'Ruang Aspirasi', icon: 'heart' },
		{ href: '/admin/users', label: 'Pengguna', icon: 'users' },
		{ href: '/admin/content-map', label: 'Content Map', icon: 'grid' },
		{ href: '/admin/progress', label: 'Progress', icon: 'trending-up' },
		{ href: '/admin/reports', label: 'Laporan', icon: 'bar-chart' },
		{ href: '/admin/files', label: 'File Manager', icon: 'folder' },
		{ href: '/admin/backup', label: 'Backup', icon: 'archive' },
		{ href: '/admin/settings', label: 'Pengaturan', icon: 'settings' },
		{ href: '/admin/audit-logs', label: 'Audit Log', icon: 'activity' }
	];

	function isActive(href: string): boolean {
		if (href === '/dashboard') return $page.url.pathname === href;
		return $page.url.pathname.startsWith(href);
	}

	// ----------------------------------------------------------------
	// Inline SVG icon resolver — kept here to avoid a separate import
	// ----------------------------------------------------------------
	const ICONS: Record<string, string> = {
		grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
		'trending-up':
			'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
		book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
		play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>',
		'message-circle':
			'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
		edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
		rss: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>',
		star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
		award:
			'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>',
		'file-text':
			'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
		users:
			'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
		settings:
			'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
		activity:
			'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
		heart:
			'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
		bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
		'bar-chart':
			'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
		folder:
			'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
		archive:
			'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>'
	};

	function getIcon(name: string): string {
		return ICONS[name] ?? '';
	}
</script>

<!-- Desktop sidebar (always visible lg+), mobile: slides in as drawer -->
<aside class="sidebar" class:sidebar--open={open} aria-label="Navigasi utama">
	<!-- Brand -->
	<div class="sidebar-brand">
		<div class="sidebar-logo" aria-hidden="true">
			<svg width="32" height="32" viewBox="0 0 40 40" fill="none">
				<rect width="40" height="40" rx="8" fill="var(--color-primary)" />
				<text
					x="50%"
					y="55%"
					dominant-baseline="middle"
					text-anchor="middle"
					fill="white"
					font-size="18"
					font-weight="700"
					font-family="Inter, sans-serif">A</text
				>
			</svg>
		</div>
		<span class="sidebar-brand-name">ALC</span>
	</div>

	<!-- Nav -->
	<nav class="sidebar-nav">
		<ul role="list">
			{#each navItems as item (item.href)}
				<li>
					<a
						href={item.href}
						class="nav-item"
						class:nav-item--active={isActive(item.href)}
						aria-current={isActive(item.href) ? 'page' : undefined}
						onclick={() => (open = false)}
					>
						<span class="nav-icon" aria-hidden="true">
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html getIcon(item.icon)}
						</span>
						<span class="nav-label">{item.label}</span>
					</a>
				</li>
			{/each}
		</ul>

		{#if isAdmin}
			<div class="nav-divider"></div>
			<p class="nav-section-label">Administrasi</p>
			<ul role="list">
				{#each adminItems as item (item.href)}
					<li>
						<a
							href={item.href}
							class="nav-item"
							class:nav-item--active={isActive(item.href)}
							aria-current={isActive(item.href) ? 'page' : undefined}
							onclick={() => (open = false)}
						>
							<span class="nav-icon" aria-hidden="true">
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								{@html getIcon(item.icon)}
							</span>
							<span class="nav-label">{item.label}</span>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</nav>

	<!-- User info -->
	<div class="sidebar-user">
		<div class="user-avatar" aria-hidden="true">
			{user?.full_name?.[0]?.toUpperCase() ?? '?'}
		</div>
		<div class="user-info">
			<span class="user-name">{user?.full_name ?? 'Pengguna'}</span>
			<span class="user-role">{user?.role ?? ''}</span>
		</div>
	</div>
</aside>

<style>
	.sidebar {
		width: 256px;
		background: var(--color-surface);
		border-right: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;
		height: 100vh;
		position: sticky;
		top: 0;
		overflow-y: auto;
		flex-shrink: 0;
		z-index: 40;
		transition: transform 0.2s ease;
	}

	@media (max-width: 1023px) {
		.sidebar {
			position: fixed;
			left: 0;
			top: 0;
			transform: translateX(-100%);
		}

		.sidebar--open {
			transform: translateX(0);
		}
	}

	.sidebar-brand {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1.25rem 1.25rem 1rem;
		border-bottom: 1px solid var(--color-border);
	}

	.sidebar-brand-name {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--color-primary);
		letter-spacing: 0.05em;
	}

	.sidebar-nav {
		flex: 1;
		padding: 0.75rem 0.75rem 1rem;
		overflow-y: auto;
	}

	.sidebar-nav ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-md);
		text-decoration: none;
		color: var(--color-text-secondary);
		font-size: 0.9rem;
		font-weight: 500;
		transition:
			background-color 0.1s,
			color 0.1s;
	}

	.nav-item:hover {
		background: var(--color-bg);
		color: var(--color-text);
	}

	.nav-item--active {
		background: color-mix(in srgb, var(--color-primary) 10%, transparent);
		color: var(--color-primary);
	}

	.nav-item--active:hover {
		background: color-mix(in srgb, var(--color-primary) 15%, transparent);
	}

	.nav-icon {
		flex-shrink: 0;
		width: 18px;
		height: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.nav-icon :global(svg) {
		width: 18px;
		height: 18px;
	}

	.nav-label {
		flex: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.nav-divider {
		height: 1px;
		background: var(--color-border);
		margin: 0.75rem 0;
	}

	.nav-section-label {
		font-size: 0.6875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-placeholder);
		padding: 0 0.75rem;
		margin: 0 0 0.25rem;
	}

	.sidebar-user {
		padding: 0.875rem 1.125rem;
		border-top: 1px solid var(--color-border);
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.user-avatar {
		width: 34px;
		height: 34px;
		border-radius: 50%;
		background: color-mix(in srgb, var(--color-primary) 15%, var(--color-secondary));
		color: var(--color-primary-dark);
		font-size: 0.875rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.user-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.user-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.user-role {
		font-size: 0.75rem;
		color: var(--color-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
</style>
