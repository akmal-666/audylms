<script lang="ts">
	import '../app.css';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { createSupabaseBrowserClient } from '$lib/supabase/client';

	let { children } = $props();

	const supabase = createSupabaseBrowserClient();

	onMount(() => {
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((event) => {
			if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
				invalidate('supabase:auth');
			}
		});

		return () => subscription.unsubscribe();
	});
</script>

{@render children()}
