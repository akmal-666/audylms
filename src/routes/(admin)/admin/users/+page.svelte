<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	const users = $derived(data.users);
	const ROLE_LABELS: Record<string, string> = { ADMIN: 'Administrator', STAFF: 'Staff' };
</script>

<svelte:head><title>Pengguna — Admin ALC</title></svelte:head>
<div class="page">
	<div class="page-header">
		<div>
			<h1 class="page-title">👥 Pengguna</h1>
			<p class="page-subtitle">{users.length} pengguna terdaftar</p>
		</div>
	</div>
	<div class="table-wrap">
		<table class="table">
			<thead
				><tr
					><th>#</th><th>Nama</th><th>Email</th><th>Kode</th><th>Peran</th><th>Posisi</th><th
						>Departemen</th
					><th>Status</th><th>Aksi</th></tr
				></thead
			>
			<tbody>
				{#each users as user, i (user.id)}
					<tr>
						<td class="num">{i + 1}</td>
						<td class="name-cell"><strong>{user.full_name}</strong></td>
						<td class="mono">{user.email}</td>
						<td class="mono">{user.employee_code ?? '—'}</td>
						<td
							><span class="role-chip role-{user.role.toLowerCase()}">{ROLE_LABELS[user.role]}</span
							></td
						>
						<td>{user.position?.label ?? '—'}</td>
						<td>{user.department?.name ?? '—'}</td>
						<td
							><span class="status-chip" class:active={user.is_active}
								>{user.is_active ? 'Aktif' : 'Nonaktif'}</span
							></td
						>
						<td><a href="/admin/users/{user.id}" class="action-link">Edit</a></td>
					</tr>
				{/each}
			</tbody>
		</table>
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
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		flex-wrap: wrap;
		gap: 1rem;
	}
	.page-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0;
	}
	.page-subtitle {
		color: var(--color-muted);
		margin: 0.25rem 0 0;
		font-size: 0.875rem;
	}
	.table-wrap {
		overflow-x: auto;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}
	.table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}
	thead {
		background: var(--color-bg-subtle);
	}
	th {
		padding: 0.75rem 1rem;
		text-align: left;
		font-weight: 600;
		color: var(--color-text-secondary);
		border-bottom: 1px solid var(--color-border);
		white-space: nowrap;
	}
	td {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--color-border);
		color: var(--color-text);
	}
	tbody tr:last-child td {
		border-bottom: none;
	}
	.num {
		color: var(--color-muted);
	}
	.name-cell strong {
		font-size: 0.875rem;
	}
	.mono {
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		color: var(--color-muted);
	}
	.role-chip {
		font-size: 0.75rem;
		font-weight: 700;
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
	}
	.role-chip.role-admin {
		background: color-mix(in srgb, var(--color-primary) 12%, transparent);
		color: var(--color-primary);
	}
	.role-chip.role-staff {
		background: var(--color-bg-subtle);
		color: var(--color-text-secondary);
	}
	.status-chip {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
		background: var(--color-bg-subtle);
		color: var(--color-muted);
	}
	.status-chip.active {
		background: color-mix(in srgb, var(--color-success) 12%, transparent);
		color: color-mix(in srgb, var(--color-success) 80%, black);
	}
	.action-link {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: none;
	}
	.action-link:hover {
		text-decoration: underline;
	}
</style>
