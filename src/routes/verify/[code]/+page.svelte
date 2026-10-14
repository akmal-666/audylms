<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const result = $derived(data.result);
	const code = $derived(data.code);
</script>

<svelte:head>
	<title>Verifikasi Sertifikat — Audy Learning Centre</title>
</svelte:head>

<div class="verify-page">
	<div class="verify-card" class:valid={result.valid} class:invalid={!result.valid}>
		{#if result.valid}
			<div class="status-icon valid">✓</div>
			<h1 class="status-title valid-title">Sertifikat Valid</h1>
			<p class="status-desc">
				Sertifikat ini dikeluarkan oleh <strong>Audy Learning Centre</strong> dan telah diverifikasi keasliannya.
			</p>

			<div class="cert-details">
				<div class="detail-row">
					<span class="detail-label">Pencapaian</span>
					<span class="detail-value">{result.entity_label}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">Tanggal Terbit</span>
					<span class="detail-value">
						{result.issued_at
							? new Date(result.issued_at).toLocaleDateString('id-ID', {
									day: 'numeric',
									month: 'long',
									year: 'numeric'
								})
							: '—'}
					</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">Kode Verifikasi</span>
					<span class="detail-value code">{result.verification_code}</span>
				</div>
			</div>
		{:else}
			<div class="status-icon invalid">✗</div>
			<h1 class="status-title invalid-title">Sertifikat Tidak Ditemukan</h1>
			<p class="status-desc">
				Kode <code>{code}</code> tidak sesuai dengan sertifikat yang kami miliki. Pastikan kode dimasukkan
				dengan benar.
			</p>
		{/if}

		<a href="/" class="back-link">← Kembali ke Beranda</a>
	</div>
</div>

<style>
	.verify-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-bg);
		padding: 1rem;
	}
	.verify-card {
		width: 100%;
		max-width: 480px;
		background: var(--color-surface);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-xl);
		padding: 2.5rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		text-align: center;
	}
	.verify-card.valid {
		border-color: var(--color-success);
	}
	.verify-card.invalid {
		border-color: var(--color-error);
	}

	.status-icon {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		font-size: 1.75rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.status-icon.valid {
		background: color-mix(in srgb, var(--color-success) 15%, transparent);
		color: var(--color-success);
	}
	.status-icon.invalid {
		background: color-mix(in srgb, var(--color-error) 15%, transparent);
		color: var(--color-error);
	}

	.status-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0;
	}
	.valid-title {
		color: color-mix(in srgb, var(--color-success) 80%, black);
	}
	.invalid-title {
		color: var(--color-error);
	}

	.status-desc {
		margin: 0;
		color: var(--color-text-secondary);
		font-size: 0.9375rem;
		line-height: 1.6;
	}

	.cert-details {
		width: 100%;
		background: var(--color-bg-subtle);
		border-radius: var(--radius-lg);
		padding: 1.125rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		text-align: left;
	}
	.detail-row {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		font-size: 0.875rem;
	}
	.detail-label {
		color: var(--color-muted);
		flex-shrink: 0;
	}
	.detail-value {
		color: var(--color-text);
		font-weight: 500;
		text-align: right;
	}
	.detail-value.code {
		font-family: var(--font-mono);
		font-size: 0.8125rem;
	}

	.back-link {
		color: var(--color-primary);
		text-decoration: none;
		font-size: 0.875rem;
		margin-top: 0.5rem;
	}
	.back-link:hover {
		text-decoration: underline;
	}
</style>
