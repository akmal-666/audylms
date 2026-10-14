<script lang="ts">
	let { children } = $props();
</script>

<!--
  Auth layout — clean, centred, no sidebar.
  Used for: /login
-->
<div class="auth-shell">
	{@render children()}
</div>

<style>
	.auth-shell {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--color-bg);
		padding: 1rem;
	}
</style>
