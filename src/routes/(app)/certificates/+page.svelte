<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const certificates = $derived(data.certificates);
</script>

<svelte:head>
	<title>Sertifikat — Audy Learning Centre</title>
</svelte:head>

<div class="page">
	<div class="page-header">
		<h1 class="page-title">🎓 Sertifikat</h1>
		<p class="page-subtitle">Sertifikat penyelesaian pembelajaran Anda.</p>
	</div>

	{#if certificates.length === 0}
		<div class="empty-state">
			<div class="empty-icon">🎓</div>
			<p>Belum ada sertifikat.</p>
			<p class="empty-sub">Selesaikan seluruh stage Growth Journey untuk mendapatkan sertifikat.</p>
		</div>
	{:else}
		<div class="certs-list">
			{#each certificates as cert (cert.id)}
				<div class="cert-card">
					<div class="cert-icon">🎓</div>
					<div class="cert-info">
						<span class="cert-title">{cert.entity_label}</span>
						<span class="cert-date">
							Diterbitkan {new Date(cert.issued_at).toLocaleDateString('id-ID', {
								day: 'numeric',
								month: 'long',
								year: 'numeric'
							})}
						</span>
						<span class="cert-code">Kode: {cert.verification_code}</span>
					</div>
					<div class="cert-actions">
						{#if cert.drive_file}
							<a
								href="/api/files/{cert.drive_file.id}/stream"
								target="_blank"
								rel="noopener noreferrer"
								class="btn-download"
							>
								⬇ Unduh PDF
							</a>
						{/if}
						<a
							href="/verify/{cert.verification_code}"
							target="_blank"
							rel="noopener noreferrer"
							class="btn-verify"
						>
							✓ Verifikasi
						</a>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 760px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.page-title {
		font-size: 1.75rem;
		font-weight: 700;
		margin: 0;
	}
	.page-subtitle {
		color: var(--color-muted);
		margin: 0.25rem 0 0;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--color-muted);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}
	.empty-icon {
		font-size: 3rem;
	}
	.empty-sub {
		font-size: 0.875rem;
		max-width: 360px;
	}

	.certs-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.cert-card {
		display: flex;
		align-items: center;
		gap: 1.125rem;
		padding: 1.25rem 1.375rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
	}

	.cert-icon {
		font-size: 2.25rem;
		flex-shrink: 0;
	}
	.cert-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.cert-title {
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-text);
	}
	.cert-date {
		font-size: 0.8125rem;
		color: var(--color-text-secondary);
	}
	.cert-code {
		font-size: 0.75rem;
		font-family: var(--font-mono);
		color: var(--color-muted);
	}

	.cert-actions {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		flex-shrink: 0;
	}
	.btn-download {
		display: inline-flex;
		align-items: center;
		padding: 0.375rem 0.875rem;
		background: var(--color-primary);
		color: white;
		border-radius: var(--radius-md);
		font-size: 0.8125rem;
		font-weight: 600;
		text-decoration: none;
	}
	.btn-download:hover {
		background: var(--color-primary-light);
	}
	.btn-verify {
		display: inline-flex;
		align-items: center;
		padding: 0.375rem 0.875rem;
		background: color-mix(in srgb, var(--color-success) 12%, transparent);
		color: color-mix(in srgb, var(--color-success) 80%, black);
		border-radius: var(--radius-md);
		font-size: 0.8125rem;
		font-weight: 600;
		text-decoration: none;
	}
</style>
