// ============================================================
// Google Drive — File Validation
// SERVER ONLY
//
// Validates MIME type, extension, file size, and file name
// before any upload reaches Google Drive.
// ============================================================

import { ALL_ALLOWED_MIME_TYPES, DEFAULT_MAX_FILE_SIZE_BYTES } from './types';
import type { ValidationResult } from './types';

/** Dangerous or unsupported file extensions */
const BLOCKED_EXTENSIONS = [
	'.exe',
	'.bat',
	'.cmd',
	'.sh',
	'.ps1',
	'.msi',
	'.dmg',
	'.app',
	'.apk',
	'.vbs',
	'.js',
	'.ts',
	'.py',
	'.rb',
	'.php',
	'.asp',
	'.aspx',
	'.cgi',
	'.pl',
	'.jar'
];

/**
 * Validate a file before upload.
 * Does not validate the actual binary content — only metadata.
 * MIME type should be determined server-side from the actual content
 * when possible (use the file-type library in production).
 */
export function validateFile(params: {
	name: string;
	mimeType: string;
	sizeBytes: number;
	maxSizeBytes?: number;
}): ValidationResult {
	const { name, mimeType, sizeBytes, maxSizeBytes = DEFAULT_MAX_FILE_SIZE_BYTES } = params;

	// 1. File name
	if (!name || name.trim().length === 0) {
		return { valid: false, error: 'File name is required.' };
	}
	if (name.length > 255) {
		return { valid: false, error: 'File name is too long (max 255 characters).' };
	}

	// 2. Check blocked extensions
	const ext = '.' + name.split('.').pop()?.toLowerCase();
	if (BLOCKED_EXTENSIONS.includes(ext)) {
		return { valid: false, error: `File type ${ext} is not allowed.` };
	}

	// 3. MIME type
	if (!mimeType || mimeType.trim().length === 0) {
		return { valid: false, error: 'MIME type is required.' };
	}
	if (!ALL_ALLOWED_MIME_TYPES.includes(mimeType)) {
		return { valid: false, error: `MIME type "${mimeType}" is not supported.` };
	}

	// 4. File size
	if (sizeBytes <= 0) {
		return { valid: false, error: 'File appears to be empty.' };
	}
	if (sizeBytes > maxSizeBytes) {
		const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(1);
		const actualMb = (sizeBytes / (1024 * 1024)).toFixed(2);
		return {
			valid: false,
			error: `File size ${actualMb} MB exceeds the maximum allowed size of ${maxMb} MB.`
		};
	}

	return { valid: true };
}

/**
 * Determine the attachment_type enum value from a MIME type.
 */
export function mimeTypeToAttachmentType(
	mimeType: string
): 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'PDF' | 'SPREADSHEET' | 'PRESENTATION' | 'OTHER' {
	if (mimeType.startsWith('image/')) return 'IMAGE';
	if (mimeType.startsWith('video/')) return 'VIDEO';
	if (mimeType === 'application/pdf') return 'PDF';
	if (
		mimeType === 'application/msword' ||
		mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
		mimeType === 'application/vnd.google-apps.document'
	) {
		return 'DOCUMENT';
	}
	if (
		mimeType === 'application/vnd.ms-excel' ||
		mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
		mimeType === 'application/vnd.google-apps.spreadsheet'
	) {
		return 'SPREADSHEET';
	}
	if (
		mimeType === 'application/vnd.ms-powerpoint' ||
		mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
		mimeType === 'application/vnd.google-apps.presentation'
	) {
		return 'PRESENTATION';
	}
	return 'OTHER';
}
