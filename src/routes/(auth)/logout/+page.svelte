<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';

	let formEl: HTMLFormElement;

	onMount(() => {
		// Auto-submit immediately when the page mounts
		formEl?.requestSubmit();
	});
</script>

<svelte:head>
	<title>Keluar — Audy Learning Centre</title>
</svelte:head>

<form method="POST" bind:this={formEl} use:enhance>
	<p style="color: var(--color-muted); text-align: center; padding: 2rem;">Sedang keluar…</p>
</form>
