<script lang="ts">
	import type { Tables } from '$lib/types/database.types';

	let {
		departments = [],
		positions = [],
		showDepartment = true,
		showPosition = true
	}: {
		departments?: Tables<'departments'>[];
		positions?: Tables<'positions'>[];
		showDepartment?: boolean;
		showPosition?: boolean;
	} = $props();
</script>

<form method="GET" class="filters">
	<div class="filter-row">
		<div class="filter-group">
			<label for="rf-from" class="filter-label">Dari</label>
			<input id="rf-from" name="from" type="date" class="filter-input" />
		</div>
		<div class="filter-group">
			<label for="rf-to" class="filter-label">Sampai</label>
			<input id="rf-to" name="to" type="date" class="filter-input" />
		</div>
		{#if showDepartment && departments.length > 0}
			<div class="filter-group">
				<label for="rf-dept" class="filter-label">Departemen</label>
				<select id="rf-dept" name="department_id" class="filter-input">
					<option value="">Semua</option>
					{#each departments as d (d.id)}<option value={d.id}>{d.name}</option>{/each}
				</select>
			</div>
		{/if}
		{#if showPosition && positions.length > 0}
			<div class="filter-group">
				<label for="rf-pos" class="filter-label">Posisi</label>
				<select id="rf-pos" name="position_id" class="filter-input">
					<option value="">Semua</option>
					{#each positions as p (p.id)}<option value={p.id}>{p.label}</option>{/each}
				</select>
			</div>
		{/if}
		<div class="filter-group filter-actions">
			<button type="submit" class="btn-filter">Terapkan Filter</button>
			<a href="?csv=1" class="btn-csv">⬇ CSV</a>
		</div>
	</div>
</form>

<style>
	.filters {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1rem 1.25rem;
	}
	.filter-row {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		align-items: flex-end;
	}
	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.filter-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.filter-input {
		padding: 0.375rem 0.625rem;
		font-size: 0.875rem;
		font-family: var(--font-sans);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
		outline: none;
		min-width: 140px;
	}
	.filter-input:focus {
		border-color: var(--color-primary);
	}
	.filter-actions {
		flex-direction: row;
		gap: 0.5rem;
		align-items: center;
	}
	.btn-filter {
		padding: 0.375rem 0.875rem;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
	}
	.btn-csv {
		padding: 0.375rem 0.875rem;
		background: color-mix(in srgb, var(--color-success) 12%, transparent);
		color: color-mix(in srgb, var(--color-success) 80%, black);
		border: 1px solid color-mix(in srgb, var(--color-success) 30%, transparent);
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
		font-weight: 600;
		text-decoration: none;
	}
</style>
