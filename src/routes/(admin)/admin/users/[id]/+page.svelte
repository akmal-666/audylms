<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
	const user = $derived(data.user);
	const departments = $derived(data.departments);
	const positions = $derived(data.positions);
	let saving = $state(false);
</script>

<svelte:head><title>Edit Pengguna — Admin ALC</title></svelte:head>
<div class="page">
	<nav class="breadcrumb">
		<a href="/admin/users">Pengguna</a>
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg
		> <span>Edit</span>
	</nav>
	<h1 class="page-title">Edit: {user.full_name}</h1>
	{#if form?.saved}<div class="alert-success">Perubahan disimpan.</div>{/if}
	{#if form?.error}<div class="alert-error">{form.error}</div>{/if}
	<form
		method="POST"
		action="?/save"
		class="form-card"
		use:enhance={() => {
			saving = true;
			return async ({ update }) => {
				saving = false;
				await update();
			};
		}}
	>
		<div class="form-grid">
			<div class="form-group span-2">
				<label for="u-fullname" class="form-label">Nama Lengkap *</label>
				<input id="u-fullname" name="full_name" type="text" class="form-input" value={user.full_name} required />
			</div>
			<div class="form-group">
				<label for="u-code" class="form-label">Kode Karyawan</label>
				<input id="u-code" name="employee_code" type="text" class="form-input" value={user.employee_code ?? ''} />
			</div>
			<div class="form-group">
				<label for="u-role" class="form-label">Peran</label>
				<select id="u-role" name="role" class="form-input">
					<option value="STAFF" selected={user.role === 'STAFF'}>Staff</option>
					<option value="ADMIN" selected={user.role === 'ADMIN'}>Administrator</option>
				</select>
			</div>
			<div class="form-group">
				<label for="u-dept" class="form-label">Departemen</label>
				<select id="u-dept" name="department_id" class="form-input">
					<option value="">— Pilih —</option>
					{#each departments as d (d.id)}<option value={d.id} selected={user.department_id === d.id}>{d.name}</option>{/each}
				</select>
			</div>
			<div class="form-group">
				<label for="u-pos" class="form-label">Posisi</label>
				<select id="u-pos" name="position_id" class="form-input">
					<option value="">— Pilih —</option>
					{#each positions as p (p.id)}<option value={p.id} selected={user.position_id === p.id}>{p.label}</option>{/each}
				</select>
			</div>
			<div class="form-group">
				<label class="checkbox-label">
					<input type="checkbox" name="is_active" checked={user.is_active} />
					<span>Akun Aktif</span>
				</label>
			</div>
		</div>
		<div class="form-actions">
			<button type="submit" class="btn-primary" disabled={saving}
				>{saving ? 'Menyimpan…' : 'Simpan'}</button
			><a href="/admin/users" class="btn-cancel">Batal</a>
		</div>
	</form>
</div>

<style>
	.page {
		max-width: 700px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.875rem;
		color: var(--color-muted);
	}
	.breadcrumb a {
		color: var(--color-primary);
		text-decoration: none;
	}
	.page-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0;
	}
	.alert-success {
		padding: 0.75rem 1rem;
		background: var(--color-success-bg);
		color: color-mix(in srgb, var(--color-success) 80%, black);
		border-radius: var(--radius-md);
	}
	.alert-error {
		padding: 0.75rem 1rem;
		background: var(--color-error-bg);
		color: var(--color-error);
		border-radius: var(--radius-md);
		font-size: 0.875rem;
	}
	.form-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}
	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.form-group.span-2 {
		grid-column: span 2;
	}
	.form-label {
		font-size: 0.875rem;
		font-weight: 500;
	}
	.form-input {
		padding: 0.625rem 0.875rem;
		font-size: 0.9375rem;
		font-family: var(--font-sans);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-text);
		outline: none;
	}
	.form-input:focus {
		border-color: var(--color-primary);
	}
	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		cursor: pointer;
		margin-top: 1.5rem;
	}
	.form-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	.btn-primary {
		padding: 0.625rem 1.5rem;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-md);
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
	}
	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.btn-cancel {
		font-size: 0.875rem;
		color: var(--color-muted);
		text-decoration: none;
	}
</style>
