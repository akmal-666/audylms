<script lang="ts">
	const reports = [
		{
			href: '/admin/reports/material-detail',
			icon: '📖',
			title: 'Detail per Materi',
			desc: 'Progress karyawan per materi Growth Journey'
		},
		{
			href: '/admin/reports/gj-summary',
			icon: '🌱',
			title: 'Ringkasan Growth Journey',
			desc: 'Tingkat penyelesaian per stage'
		},
		{
			href: '/admin/reports/employee-summary',
			icon: '👤',
			title: 'Ringkasan Karyawan',
			desc: 'Poin, lencana, sertifikat per karyawan'
		},
		{
			href: '/admin/reports/qna',
			icon: '💬',
			title: 'Tanya Jawab',
			desc: 'Statistik pertanyaan dan jawaban'
		},
		{
			href: '/admin/reports/feedback',
			icon: '💭',
			title: 'Ruang Aspirasi',
			desc: 'Statistik umpan balik dan status penanganan'
		},
		{
			href: '/admin/reports/drive-usage',
			icon: '📁',
			title: 'Penggunaan File Drive',
			desc: 'Distribusi file, ukuran, dan modul'
		}
	];
</script>

<svelte:head><title>Laporan — Admin ALC</title></svelte:head>
<div class="page">
	<h1 class="page-title">📊 Laporan</h1>
	<p class="page-subtitle">Pilih jenis laporan yang ingin dilihat.</p>
	<div class="reports-grid">
		{#each reports as r (r.href)}
			<a href={r.href} class="report-card">
				<span class="report-icon">{r.icon}</span>
				<div class="report-info">
					<span class="report-title">{r.title}</span>
					<span class="report-desc">{r.desc}</span>
				</div>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg
				>
			</a>
		{/each}
	</div>
</div>

<style>
	.page {
		max-width: 900px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.page-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0;
	}
	.page-subtitle {
		color: var(--color-muted);
		margin: 0;
		font-size: 0.9375rem;
	}
	.reports-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 1rem;
	}
	.report-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.125rem 1.25rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		text-decoration: none;
		color: inherit;
		transition:
			border-color 0.15s,
			transform 0.15s;
	}
	.report-card:hover {
		border-color: var(--color-secondary);
		transform: translateY(-1px);
	}
	.report-icon {
		font-size: 1.75rem;
		flex-shrink: 0;
	}
	.report-info {
		flex: 1;
		min-width: 0;
	}
	.report-title {
		display: block;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-text);
	}
	.report-desc {
		display: block;
		font-size: 0.8125rem;
		color: var(--color-muted);
	}
</style>
