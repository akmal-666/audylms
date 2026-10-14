<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let loading = $state(false);
	let showPassword = $state(false);
</script>

<svelte:head>
	<title>Masuk — Audy Learning Centre</title>
</svelte:head>

<div class="login-card">
	<!-- Logo / Brand -->
	<div class="login-brand">
		<div class="login-logo">
			<svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
				<rect width="40" height="40" rx="10" fill="var(--color-primary)" />
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
		<div>
			<h1 class="login-title">Audy Learning Centre</h1>
			<p class="login-subtitle">Masuk ke akun Anda</p>
		</div>
	</div>

	<!-- Error Message -->
	{#if form?.error}
		<div class="alert alert-error" role="alert">
			<svg
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				aria-hidden="true"
			>
				<circle cx="12" cy="12" r="10" />
				<line x1="12" y1="8" x2="12" y2="12" />
				<line x1="12" y1="16" x2="12.01" y2="16" />
			</svg>
			{form.error}
		</div>
	{/if}

	<!-- Login Form -->
	<form
		method="POST"
		action="?/login"
		use:enhance={() => {
			loading = true;
			return async ({ update }) => {
				loading = false;
				await update();
			};
		}}
		novalidate
	>
		<div class="form-group">
			<label for="email" class="form-label">Email</label>
			<input
				id="email"
				name="email"
				type="email"
				class="form-input"
				placeholder="nama@audydental.com"
				value={form?.email ?? ''}
				autocomplete="email"
				required
				disabled={loading}
			/>
		</div>

		<div class="form-group">
			<label for="password" class="form-label">Password</label>
			<div class="input-wrapper">
				<input
					id="password"
					name="password"
					type={showPassword ? 'text' : 'password'}
					class="form-input"
					placeholder="••••••••"
					autocomplete="current-password"
					required
					disabled={loading}
				/>
				<button
					type="button"
					class="toggle-password"
					onclick={() => (showPassword = !showPassword)}
					aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
				>
					{#if showPassword}
						<svg
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							aria-hidden="true"
						>
							<path
								d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
							/>
							<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
							<line x1="1" y1="1" x2="23" y2="23" />
						</svg>
					{:else}
						<svg
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							aria-hidden="true"
						>
							<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
							<circle cx="12" cy="12" r="3" />
						</svg>
					{/if}
				</button>
			</div>
		</div>

		<button type="submit" class="btn-primary" disabled={loading}>
			{#if loading}
				<span class="spinner" aria-hidden="true"></span>
				Memproses…
			{:else}
				Masuk
			{/if}
		</button>
	</form>

	<p class="login-footer">Hubungi administrator jika Anda lupa kata sandi.</p>
</div>

<style>
	.login-card {
		width: 100%;
		max-width: 400px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
		padding: 2.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.login-brand {
		display: flex;
		align-items: center;
		gap: 0.875rem;
	}

	.login-logo {
		flex-shrink: 0;
	}

	.login-title {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0;
	}

	.login-subtitle {
		font-size: 0.875rem;
		color: var(--color-muted);
		margin: 0.125rem 0 0;
	}

	.alert {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border-radius: var(--radius-md);
		font-size: 0.875rem;
	}

	.alert-error {
		background: var(--color-error-bg);
		color: var(--color-error);
		border: 1px solid color-mix(in srgb, var(--color-error) 20%, transparent);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.form-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text);
	}

	.form-input {
		width: 100%;
		padding: 0.625rem 0.875rem;
		font-size: 0.9375rem;
		font-family: var(--font-sans);
		color: var(--color-text);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
		outline: none;
	}

	.form-input:focus {
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
	}

	.form-input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.input-wrapper {
		position: relative;
	}

	.input-wrapper .form-input {
		padding-right: 2.75rem;
	}

	.toggle-password {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		cursor: pointer;
		color: var(--color-muted);
		padding: 0.25rem;
		display: flex;
		align-items: center;
	}

	.toggle-password:hover {
		color: var(--color-text);
	}

	.btn-primary {
		width: 100%;
		padding: 0.75rem 1.5rem;
		font-size: 0.9375rem;
		font-weight: 600;
		font-family: var(--font-sans);
		color: white;
		background: var(--color-primary);
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		transition: background-color 0.15s;
		margin-top: 0.25rem;
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--color-primary-light);
	}

	.btn-primary:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.login-footer {
		text-align: center;
		font-size: 0.8125rem;
		color: var(--color-muted);
		margin: 0;
	}
</style>
