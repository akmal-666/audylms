// ============================================================
// Google Drive — File Download & Streaming
// SERVER ONLY
//
// Security model:
//   Employee → ALC API → authorize user → Google Drive → stream to browser
//
// Employees never receive Google credentials.
// All Drive API calls happen server-side.
// ============================================================

import { getDriveClient } from './client';

/** Shape of a googleapis stream response (Drive API) */
interface DriveStreamResponse {
	data: NodeJS.ReadableStream;
	headers: Record<string, string>;
	status: number;
}

/**
 * Download a file from Drive into a Buffer.
 * Use only for small files (thumbnails, metadata exports).
 * For video/large files, use streamFile() instead.
 */
export async function downloadFileToBuffer(fileId: string): Promise<Buffer> {
	const drive = getDriveClient();

	const res = await drive.files.get(
		{ fileId, alt: 'media', supportsAllDrives: true },
		{ responseType: 'arraybuffer' }
	);

	return Buffer.from(res.data as ArrayBuffer);
}

/**
 * Get a readable stream for a file from Drive.
 * Use this to stream files to the browser response.
 *
 * Supports HTTP Range requests for video playback — pass the Range
 * header value as `rangeHeader`.
 *
 * Example in a +server.ts:
 *   const { stream, contentType, contentLength } = await streamFile(fileId);
 *   return new Response(stream, { headers: { 'Content-Type': contentType } });
 */
export async function streamFile(
	fileId: string,
	rangeHeader?: string
): Promise<{
	stream: NodeJS.ReadableStream;
	contentType: string;
	contentLength: number | null;
	contentRange: string | null;
}> {
	const drive = getDriveClient();

	const extraHeaders: Record<string, string> = {};
	if (rangeHeader) {
		extraHeaders['Range'] = rangeHeader;
	}

	const res = (await drive.files.get(
		{ fileId, alt: 'media', supportsAllDrives: true },
		{ responseType: 'stream', headers: extraHeaders }
	)) as unknown as DriveStreamResponse;

	const h = res.headers;

	return {
		stream: res.data,
		contentType: h['content-type'] ?? 'application/octet-stream',
		contentLength: h['content-length'] ? Number(h['content-length']) : null,
		contentRange: h['content-range'] ?? null
	};
}

/**
 * Export a Google Workspace file (Docs, Sheets, Slides) to a downloadable format.
 * Google-native files cannot be downloaded as-is; they must be exported.
 *
 * Common mimeType targets:
 *   Google Docs   → 'application/pdf' or 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
 *   Google Sheets → 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
 *   Google Slides → 'application/pdf' or 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
 */
export async function exportGoogleFile(
	fileId: string,
	exportMimeType: string
): Promise<NodeJS.ReadableStream> {
	const drive = getDriveClient();

	const res = (await drive.files.export(
		{ fileId, mimeType: exportMimeType },
		{ responseType: 'stream' }
	)) as unknown as DriveStreamResponse;

	return res.data;
}
