<script lang="ts">
	import type { MaterialContentWithFile } from '$lib/types/growth-journey.types';

	let { block }: { block: MaterialContentWithFile } = $props();
</script>

{#if block.content_type === 'RICH_TEXT' && block.body}
	<!-- Rich text — rendered as sanitised HTML -->
	<div class="content-rich-text">
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html block.body}
	</div>
{:else if block.content_type === 'IMAGE' && block.drive_file}
	<figure class="content-image">
		<img
			src="/api/files/{block.drive_file.id}/stream"
			alt={block.caption ?? block.drive_file.name}
			loading="lazy"
		/>
		{#if block.caption}
			<figcaption>{block.caption}</figcaption>
		{/if}
	</figure>
{:else if block.content_type === 'VIDEO' && block.drive_file}
	<figure class="content-video">
		<video controls preload="metadata">
			<source src="/api/files/{block.drive_file.id}/stream" type={block.drive_file.mime_type} />
			Browser Anda tidak mendukung pemutaran video.
		</video>
		{#if block.caption}
			<figcaption>{block.caption}</figcaption>
		{/if}
	</figure>
{:else if block.content_type === 'DOCUMENT' && block.drive_file}
	<div class="content-document">
		<div class="doc-preview">
			<span class="doc-icon">
				{block.drive_file.mime_type === 'application/pdf' ? '📄' : '📋'}
			</span>
			<div class="doc-info">
				<span class="doc-name">{block.drive_file.name}</span>
				{#if block.caption}<span class="doc-caption">{block.caption}</span>{/if}
			</div>
			<a
				href="/api/files/{block.drive_file.id}/stream"
				target="_blank"
				rel="noopener noreferrer"
				class="doc-btn"
			>
				Buka
			</a>
		</div>
		{#if block.drive_file.mime_type === 'application/pdf' && block.drive_file.web_view_url}
			<iframe
				src="https://drive.google.com/file/d/{block.drive_file.drive_file_id}/preview"
				title={block.drive_file.name}
				allow="autoplay"
				class="pdf-embed"
			></iframe>
		{/if}
	</div>
{:else if block.content_type === 'GOOGLE_DOCS' && block.body}
	<div class="content-google-doc">
		<div class="gdoc-header">
			<span>📝</span>
			<span class="gdoc-label">Google Document</span>
			<a href={block.body} target="_blank" rel="noopener noreferrer" class="doc-btn">
				Buka di Google Docs
			</a>
		</div>
		<iframe
			src={block.body.replace('/edit', '/preview').replace('/pub', '/embed')}
			title={block.caption ?? 'Google Document'}
			class="gdoc-embed"
		></iframe>
	</div>
{:else if block.content_type === 'EXTERNAL_LINK' && block.body}
	<div class="content-link">
		<a href={block.body} target="_blank" rel="noopener noreferrer" class="external-link">
			<svg
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				aria-hidden="true"
			>
				<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
				<polyline points="15 3 21 3 21 9" />
				<line x1="10" y1="14" x2="21" y2="3" />
			</svg>
			{block.caption ?? block.body}
		</a>
	</div>
{/if}

<style>
	/* Rich text */
	.content-rich-text {
		font-size: 0.9375rem;
		line-height: 1.7;
		color: var(--color-text);
	}
	.content-rich-text :global(h1),
	.content-rich-text :global(h2),
	.content-rich-text :global(h3) {
		font-weight: 700;
		color: var(--color-text);
		margin: 1.25em 0 0.5em;
	}
	.content-rich-text :global(h2) {
		font-size: 1.25rem;
	}
	.content-rich-text :global(h3) {
		font-size: 1.0625rem;
	}
	.content-rich-text :global(p) {
		margin: 0 0 0.875em;
	}
	.content-rich-text :global(ul),
	.content-rich-text :global(ol) {
		padding-left: 1.5em;
		margin: 0 0 0.875em;
	}
	.content-rich-text :global(li) {
		margin-bottom: 0.25em;
	}
	.content-rich-text :global(strong) {
		font-weight: 700;
	}
	.content-rich-text :global(a) {
		color: var(--color-primary);
	}
	.content-rich-text :global(blockquote) {
		border-left: 3px solid var(--color-secondary);
		padding-left: 1rem;
		color: var(--color-text-secondary);
		font-style: italic;
		margin: 1em 0;
	}

	/* Image */
	.content-image {
		margin: 0;
	}
	.content-image img {
		max-width: 100%;
		height: auto;
		border-radius: var(--radius-lg);
		display: block;
	}
	.content-image figcaption,
	.content-video figcaption {
		margin-top: 0.5rem;
		font-size: 0.8125rem;
		color: var(--color-muted);
		text-align: center;
	}

	/* Video */
	.content-video {
		margin: 0;
	}
	.content-video video {
		width: 100%;
		max-width: 100%;
		border-radius: var(--radius-lg);
		background: #000;
	}

	/* Document */
	.content-document {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.doc-preview {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		padding: 0.875rem 1rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}
	.doc-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}
	.doc-info {
		flex: 1;
		min-width: 0;
	}
	.doc-name {
		display: block;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-text);
	}
	.doc-caption {
		font-size: 0.75rem;
		color: var(--color-muted);
	}
	.doc-btn {
		flex-shrink: 0;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 10%, transparent);
		padding: 0.375rem 0.875rem;
		border-radius: var(--radius-sm);
		text-decoration: none;
	}
	.doc-btn:hover {
		background: color-mix(in srgb, var(--color-primary) 18%, transparent);
	}
	.pdf-embed {
		width: 100%;
		height: 520px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}

	/* Google Docs */
	.content-google-doc {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.gdoc-header {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.75rem 1rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}
	.gdoc-label {
		flex: 1;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-text);
	}
	.gdoc-embed {
		width: 100%;
		height: 520px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}

	/* External link */
	.content-link {
		display: contents;
	}
	.external-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-primary);
		font-weight: 500;
		text-decoration: underline;
		font-size: 0.9375rem;
	}
</style>
