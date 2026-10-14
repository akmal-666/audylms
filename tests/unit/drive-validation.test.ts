// ============================================================
// Google Drive — File Validation Unit Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import { validateFile, mimeTypeToAttachmentType } from '$lib/server/google-drive/validation';

const THREE_MB = 3 * 1024 * 1024;

// ──────────────────────────────────────────────
// validateFile
// ──────────────────────────────────────────────

describe('validateFile()', () => {
	it('accepts a valid JPEG image under 3 MB', () => {
		const result = validateFile({
			name: 'photo.jpg',
			mimeType: 'image/jpeg',
			sizeBytes: 1_000_000
		});
		expect(result.valid).toBe(true);
	});

	it('accepts a valid PDF under 3 MB', () => {
		const result = validateFile({
			name: 'document.pdf',
			mimeType: 'application/pdf',
			sizeBytes: 2_500_000
		});
		expect(result.valid).toBe(true);
	});

	it('accepts a valid MP4 video under 3 MB', () => {
		const result = validateFile({
			name: 'clip.mp4',
			mimeType: 'video/mp4',
			sizeBytes: 2_000_000
		});
		expect(result.valid).toBe(true);
	});

	it('rejects a file that exceeds 3 MB', () => {
		const result = validateFile({
			name: 'big.pdf',
			mimeType: 'application/pdf',
			sizeBytes: THREE_MB + 1
		});
		expect(result.valid).toBe(false);
		expect(result.error).toContain('exceeds');
	});

	it('rejects a custom max size override', () => {
		const result = validateFile({
			name: 'small.jpg',
			mimeType: 'image/jpeg',
			sizeBytes: 600_000,
			maxSizeBytes: 500_000
		});
		expect(result.valid).toBe(false);
		expect(result.error).toContain('exceeds');
	});

	it('rejects a blocked executable extension', () => {
		const result = validateFile({
			name: 'malware.exe',
			mimeType: 'application/octet-stream',
			sizeBytes: 100
		});
		expect(result.valid).toBe(false);
		expect(result.error).toContain('.exe');
	});

	it('rejects an unsupported MIME type', () => {
		const result = validateFile({
			name: 'archive.zip',
			mimeType: 'application/zip',
			sizeBytes: 100_000
		});
		expect(result.valid).toBe(false);
		expect(result.error).toContain('not supported');
	});

	it('rejects an empty file name', () => {
		const result = validateFile({ name: '', mimeType: 'image/jpeg', sizeBytes: 100 });
		expect(result.valid).toBe(false);
		expect(result.error).toContain('required');
	});

	it('rejects a zero-byte file', () => {
		const result = validateFile({ name: 'empty.jpg', mimeType: 'image/jpeg', sizeBytes: 0 });
		expect(result.valid).toBe(false);
		expect(result.error).toContain('empty');
	});

	it('rejects a file name that is too long', () => {
		const result = validateFile({
			name: 'a'.repeat(256) + '.jpg',
			mimeType: 'image/jpeg',
			sizeBytes: 1000
		});
		expect(result.valid).toBe(false);
		expect(result.error).toContain('too long');
	});
});

// ──────────────────────────────────────────────
// mimeTypeToAttachmentType
// ──────────────────────────────────────────────

describe('mimeTypeToAttachmentType()', () => {
	it('maps image/jpeg → IMAGE', () => {
		expect(mimeTypeToAttachmentType('image/jpeg')).toBe('IMAGE');
	});

	it('maps image/png → IMAGE', () => {
		expect(mimeTypeToAttachmentType('image/png')).toBe('IMAGE');
	});

	it('maps video/mp4 → VIDEO', () => {
		expect(mimeTypeToAttachmentType('video/mp4')).toBe('VIDEO');
	});

	it('maps application/pdf → PDF', () => {
		expect(mimeTypeToAttachmentType('application/pdf')).toBe('PDF');
	});

	it('maps .docx → DOCUMENT', () => {
		expect(
			mimeTypeToAttachmentType(
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
			)
		).toBe('DOCUMENT');
	});

	it('maps .xlsx → SPREADSHEET', () => {
		expect(
			mimeTypeToAttachmentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
		).toBe('SPREADSHEET');
	});

	it('maps .pptx → PRESENTATION', () => {
		expect(
			mimeTypeToAttachmentType(
				'application/vnd.openxmlformats-officedocument.presentationml.presentation'
			)
		).toBe('PRESENTATION');
	});

	it('maps unknown type → OTHER', () => {
		expect(mimeTypeToAttachmentType('application/octet-stream')).toBe('OTHER');
	});
});
