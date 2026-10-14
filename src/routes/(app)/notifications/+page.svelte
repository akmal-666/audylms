<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	const notifications = $derived(data.notifications);
	const unread = $derived(data.unread_count);
	const TYPE_ICONS: Record<string, string> = {
		POINTS_EARNED: '⭐',
		BADGE_EARNED: '🏅',
		CERTIFICATE_ISSUED: '🎓',
		QNA_ANSWER: '💬',
		QNA_VERIFIED: '✓',
		FRESH_UPDATE: '📰',
		ASPIRATION_RESPONSE: '💭',
		SYSTEM: '🔔'
	};
</script>

<svelte:head><title>Notifikasi{unread > 0 ? ` (${unread})` : ''} — ALC</title></svelte:head>
<div class="page">
	<div class="page-header">
		<div>
			<h1 class="page-title">🔔 Notifikasi</h1>
			{#if unread > 0}<p class="page-subtitle">{unread} belum dibaca</p>{/if}
		</div>
		{#if unread > 0}
			<form method="POST" action="?/markAllRead" use:enhance>
				<button type="submit" class="btn-mark-all">✓ Tandai Semua Dibaca</button>
			</form>
		{/if}
	</div>

	{#if notifications.length === 0}
		<p class="empty">Tidak ada notifikasi.</p>
	{:else}
		<ul class="notif-list">
			{#each notifications as n (n.id)}
				<li class="notif-item" class:unread={!n.is_read}>
					<span class="notif-icon" aria-hidden="true">{TYPE_ICONS[n.type] ?? '🔔'}</span>
					<div class="notif-body">
						<span class="notif-title">{n.title}</span>
						{#if n.body}<p class="notif-desc">{n.body}</p>{/if}
						<span class="notif-time"
							>{new Date(n.created_at).toLocaleString('id-ID', {
								day: 'numeric',
								month: 'short',
								hour: '2-digit',
								minute: '2-digit'
							})}</span
						>
					</div>
					<div class="notif-actions">
						{#if n.action_url}
							<a href={n.action_url} class="notif-link" aria-label="Lihat detail">→</a>
						{/if}
						{#if !n.is_read}
							<form method="POST" action="?/markRead" use:enhance>
								<input type="hidden" name="id" value={n.id} />
								<button type="submit" class="notif-mark-btn" aria-label="Tandai dibaca">✓</button>
							</form>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
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
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		flex-wrap: wrap;
		gap: 1rem;
	}
	.page-title {
		font-size: 1.75rem;
		font-weight: 700;
		margin: 0;
	}
	.page-subtitle {
		color: var(--color-primary);
		font-weight: 600;
		margin: 0.25rem 0 0;
		font-size: 0.875rem;
	}
	.btn-mark-all {
		padding: 0.375rem 0.875rem;
		background: color-mix(in srgb, var(--color-primary) 10%, transparent);
		color: var(--color-primary);
		border: none;
		border-radius: var(--radius-md);
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
	}
	.empty {
		color: var(--color-muted);
		font-style: italic;
	}
	.notif-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}
	.notif-item {
		display: flex;
		align-items: flex-start;
		gap: 0.875rem;
		padding: 0.875rem 1.125rem;
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface);
		transition: background 0.1s;
	}
	.notif-item:last-child {
		border-bottom: none;
	}
	.notif-item.unread {
		background: color-mix(in srgb, var(--color-primary) 4%, var(--color-surface));
	}
	.notif-icon {
		font-size: 1.25rem;
		flex-shrink: 0;
		margin-top: 0.125rem;
	}
	.notif-body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.notif-title {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-text);
	}
	.notif-desc {
		font-size: 0.8125rem;
		color: var(--color-muted);
		margin: 0;
	}
	.notif-time {
		font-size: 0.75rem;
		color: var(--color-placeholder);
	}
	.notif-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}
	.notif-link {
		font-size: 1rem;
		color: var(--color-primary);
		text-decoration: none;
		font-weight: 700;
	}
	.notif-mark-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--color-muted);
		font-size: 0.875rem;
		padding: 0.25rem 0.375rem;
		border-radius: var(--radius-sm);
	}
	.notif-mark-btn:hover {
		color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 8%, transparent);
	}
</style>
