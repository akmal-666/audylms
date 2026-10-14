<script lang="ts">
	import type { LayoutData } from './$types';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import TopNav from '$lib/components/layout/TopNav.svelte';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	let sidebarOpen = $state(false);
</script>

<div class="app-shell">
	<Sidebar user={data.user} bind:open={sidebarOpen} />

	{#if sidebarOpen}
		<button class="sidebar-overlay" onclick={() => (sidebarOpen = false)} aria-label="Tutup menu"
		></button>
	{/if}

	<div class="app-main">
		<TopNav user={data.user} onMenuToggle={() => (sidebarOpen = !sidebarOpen)} />
		<main class="app-content">
			{@render children()}
		</main>
	</div>
</div>

<style>
	.app-shell {
		display: flex;
		min-height: 100vh;
		background: var(--color-bg);
	}

	.app-main {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.app-content {
		flex: 1;
		padding: 1.5rem;
	}

	@media (min-width: 1024px) {
		.app-content {
			padding: 2rem 2.5rem;
		}
	}

	.sidebar-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		z-index: 30;
		border: none;
		cursor: pointer;
	}

	@media (min-width: 1024px) {
		.sidebar-overlay {
			display: none;
		}
	}
</style>
