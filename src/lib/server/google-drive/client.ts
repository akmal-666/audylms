// ============================================================
// Google Drive API Client
// SERVER ONLY — credentials must never reach the browser.
// ============================================================

import { google } from 'googleapis';
import {
	GOOGLE_SERVICE_ACCOUNT_EMAIL,
	GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
} from '$env/static/private';

const SCOPES = ['https://www.googleapis.com/auth/drive'];

/**
 * Creates an authenticated Google Drive API client using service account credentials.
 *
 * The service account must be granted access to the Shared Drive
 * (either as a member or via domain-wide delegation if using Workspace).
 *
 * Private key newlines may be escaped as \\n in environment variables —
 * this function normalises them.
 */
export function getGoogleDriveClient() {
	// Normalise escaped newlines from env var storage
	const privateKey = GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n');

	const auth = new google.auth.GoogleAuth({
		credentials: {
			client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
			private_key: privateKey
		},
		scopes: SCOPES
	});

	return google.drive({ version: 'v3', auth });
}

/** Singleton — reuse across requests in the same server process */
let _driveClient: ReturnType<typeof getGoogleDriveClient> | null = null;

export function getDriveClient() {
	if (!_driveClient) {
		_driveClient = getGoogleDriveClient();
	}
	return _driveClient;
}
