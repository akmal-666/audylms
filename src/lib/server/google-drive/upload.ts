// ============================================================
// Google Drive — File Upload
// SERVER ONLY
//
// Supports two upload strategies:
//   1. Multipart upload   — for files ≤ 5 MB (simple, single request)
//   2. Resumable upload   — for files > 5 MB (chunked, restartable)
//
// The current business requirement limits attachments to 3 MB,
// so multipart upload covers all cases. Resumable infrastructure
// is provided for future-proofing.
// ============================================================

import { Readable } from 'stream';
import { getDriveClient } from './client';
import { validateFile } from './validation';
import type { UploadFileParams, UploadResult } from './types';

const FILE_FIELDS = 'id, name, mimeType, size, webViewLink, webContentLink, thumbnailLink, parents';

/**
 * Upload a file using multipart upload.
 * Best for files under 5 MB.
 *
 * @param params - Upload parameters including stream/buffer, name, mimeType, folderId
 * @param maxSizeBytes - Maximum allowed file size (from system_settings or env)
 * @returns Resolved UploadResult with Drive metadata
 */
export async function uploadFile(
	params: UploadFileParams,
	maxSizeBytes: number = 3 * 1024 * 1024
): Promise<UploadResult> {
	const { body, name, mimeType, folderId, sizeBytes } = params;
	const drive = getDriveClient();

	// Validate before upload
	const validation = validateFile({ name, mimeType, sizeBytes: sizeBytes ?? 0 });
	if (!validation.valid) {
		throw new Error(`File validation failed: ${validation.error}`);
	}

	if (sizeBytes && sizeBytes > maxSizeBytes) {
		throw new Error(
			`File size ${sizeBytes} bytes exceeds maximum allowed size of ${maxSizeBytes} bytes`
		);
	}

	// Convert Buffer to Readable stream if needed
	const mediaBody = Buffer.isBuffer(body) ? Readable.from(body) : body;

	const res = await drive.files.create({
		requestBody: {
			name,
			parents: [folderId]
		},
		media: {
			mimeType,
			body: mediaBody
		},
		fields: FILE_FIELDS,
		supportsAllDrives: true
	});

	const f = res.data;
	return {
		driveFileId: f.id ?? '',
		name: f.name ?? name,
		mimeType: f.mimeType ?? mimeType,
		sizeBytes: f.size != null ? Number(f.size) : (sizeBytes ?? null),
		webViewLink: f.webViewLink ?? null,
		webContentLink: f.webContentLink ?? null,
		thumbnailLink: f.thumbnailLink ?? null,
		folderId: f.parents?.[0] ?? folderId
	};
}

/**
 * Initiate a resumable upload session.
 * Returns a session URI that the caller can use to upload in chunks.
 *
 * This is the architecture for large files — actual chunked upload
 * happens in the caller (e.g. a server-sent events endpoint).
 *
 * See: https://developers.google.com/drive/api/guides/manage-uploads#resumable
 */
export async function initiateResumableUpload(params: {
	name: string;
	mimeType: string;
	folderId: string;
	sizeBytes: number;
}): Promise<string> {
	const drive = getDriveClient();

	// The googleapis library handles the resumable upload initiation
	// by using uploadType=resumable when a resumable option is set.
	// We return the session URI for the caller to use.
	const res = await drive.files.create(
		{
			requestBody: {
				name: params.name,
				parents: [params.folderId]
			},
			media: {
				mimeType: params.mimeType,
				body: Readable.from(Buffer.alloc(0)) // placeholder
			},
			supportsAllDrives: true
		},
		{
			// Use resumable upload via axios config
			params: { uploadType: 'resumable' }
		}
	);

	// The resumable session URI is in the Location header
	const locationHeader = (res as unknown as { headers?: Record<string, string> }).headers?.location;
	if (!locationHeader) {
		throw new Error('Failed to initiate resumable upload: no session URI returned');
	}

	return locationHeader;
}
