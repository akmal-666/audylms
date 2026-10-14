// ============================================================
// GET /api/files/[id]/stream
//
// Securely stream a file from Google Drive to the browser.
//
// Security model:
//   Employee → ALC API → authorize user → Google Drive → stream
//
// The [id] is the Supabase drive_files UUID (not the Drive file ID).
// This prevents clients from requesting arbitrary Drive files.
//
// Supports HTTP Range requests for video playback.
// ============================================================

import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';
import { getDriveFileById } from '$lib/server/services/drive-metadata';
import { streamFile } from '$lib/server/google-drive/download';

export const GET: RequestHandler = async ({ params, request, locals }) => {
	// 1. Authenticate
	const { user } = await locals.safeGetSession();
	requireAuth(user);

	// 2. Look up the file metadata in Supabase (validates the file exists + not deleted)
	const driveFile = await getDriveFileById(
		locals.supabase as unknown as Parameters<typeof getDriveFileById>[0],
		params.id
	);

	if (!driveFile) {
		error(404, { message: 'File not found.' });
	}

	// 3. Future: add position-based content authorization here
	//    For now: any authenticated user can stream any non-deleted file.

	// 4. Stream from Google Drive
	const rangeHeader = request.headers.get('range') ?? undefined;

	let streamResult;
	try {
		streamResult = await streamFile(driveFile.drive_file_id, rangeHeader);
	} catch (err) {
		const msg = err instanceof Error ? err.message : 'Stream failed';
		error(502, { message: `Could not retrieve file from storage: ${msg}` });
	}

	const headers: Record<string, string> = {
		'Content-Type': streamResult.contentType,
		'Cache-Control': 'private, max-age=3600',
		'Content-Disposition': `inline; filename="${encodeURIComponent(driveFile.name)}"`,
		'Accept-Ranges': 'bytes'
	};

	if (streamResult.contentLength) {
		headers['Content-Length'] = String(streamResult.contentLength);
	}

	const statusCode = rangeHeader && streamResult.contentRange ? 206 : 200;
	if (streamResult.contentRange) {
		headers['Content-Range'] = streamResult.contentRange;
	}

	// Convert Node.js readable stream to Web API ReadableStream
	const webStream = new ReadableStream({
		start(controller) {
			streamResult.stream.on('data', (chunk: Buffer) => controller.enqueue(chunk));
			streamResult.stream.on('end', () => controller.close());
			streamResult.stream.on('error', (err: Error) => controller.error(err));
		}
	});

	return new Response(webStream, { status: statusCode, headers });
};
