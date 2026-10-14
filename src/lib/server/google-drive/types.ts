// ============================================================
// Google Drive Service — Shared Types
// SERVER ONLY
// ============================================================

/** Module storage areas that map to Drive sub-folders */
export type StorageArea =
	| 'growth-journey'
	| 'product-knowledge'
	| 'play-learn'
	| 'lets-practice'
	| 'fresh-update'
	| 'qna'
	| 'system';

/** Supported MIME types for upload validation */
export const ALLOWED_MIME_TYPES: Record<string, string[]> = {
	IMAGE: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
	VIDEO: ['video/mp4', 'video/quicktime', 'video/webm'],
	PDF: ['application/pdf'],
	DOCUMENT: [
		'application/msword',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'application/vnd.google-apps.document'
	],
	SPREADSHEET: [
		'application/vnd.ms-excel',
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		'application/vnd.google-apps.spreadsheet'
	],
	PRESENTATION: [
		'application/vnd.ms-powerpoint',
		'application/vnd.openxmlformats-officedocument.presentationml.presentation',
		'application/vnd.google-apps.presentation'
	]
};

/** All allowed MIME types as a flat array */
export const ALL_ALLOWED_MIME_TYPES = Object.values(ALLOWED_MIME_TYPES).flat();

/** Max file size in bytes — sourced from system_settings at runtime; fallback here */
export const DEFAULT_MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB

/** Map of storage area to Drive folder ID env variable name */
export const STORAGE_AREA_ENV_MAP: Record<StorageArea, string> = {
	'growth-journey': 'GOOGLE_DRIVE_GROWTH_JOURNEY_FOLDER_ID',
	'product-knowledge': 'GOOGLE_DRIVE_PRODUCT_KNOWLEDGE_FOLDER_ID',
	'play-learn': 'GOOGLE_DRIVE_PLAY_LEARN_FOLDER_ID',
	'lets-practice': 'GOOGLE_DRIVE_LETS_PRACTICE_FOLDER_ID',
	'fresh-update': 'GOOGLE_DRIVE_FRESH_UPDATE_FOLDER_ID',
	qna: 'GOOGLE_DRIVE_QNA_FOLDER_ID',
	system: 'GOOGLE_DRIVE_SYSTEM_FOLDER_ID'
};

/** Resolved Google Drive file metadata (what we return from service calls) */
export interface DriveFileMetadata {
	id: string; // Google Drive fileId
	name: string;
	mimeType: string;
	size: number | null;
	webViewLink: string | null;
	webContentLink: string | null;
	thumbnailLink: string | null;
	parents: string[];
	createdTime: string | null;
	modifiedTime: string | null;
}

/** Parameters for uploading a file */
export interface UploadFileParams {
	/** Readable stream or Buffer of the file content */
	body: NodeJS.ReadableStream | Buffer;
	/** Original file name */
	name: string;
	/** MIME type (validated before upload) */
	mimeType: string;
	/** Target Drive folder ID */
	folderId: string;
	/** File size in bytes (required for resumable upload progress) */
	sizeBytes?: number;
}

/** Result of a successful upload */
export interface UploadResult {
	driveFileId: string;
	name: string;
	mimeType: string;
	sizeBytes: number | null;
	webViewLink: string | null;
	webContentLink: string | null;
	thumbnailLink: string | null;
	folderId: string | null;
}

/** Parameters for searching files */
export interface SearchFilesParams {
	query?: string;
	folderId?: string;
	mimeTypes?: string[];
	pageSize?: number;
	pageToken?: string;
}

/** File validation result */
export interface ValidationResult {
	valid: boolean;
	error?: string;
}

/** ALC module folder definitions */
export interface ModuleFolder {
	name: string;
	storageArea: StorageArea;
	envKey: string;
}

export const MODULE_FOLDERS: ModuleFolder[] = [
	{
		name: '01 - Growth Journey',
		storageArea: 'growth-journey',
		envKey: 'GOOGLE_DRIVE_GROWTH_JOURNEY_FOLDER_ID'
	},
	{
		name: '02 - Product Knowledge',
		storageArea: 'product-knowledge',
		envKey: 'GOOGLE_DRIVE_PRODUCT_KNOWLEDGE_FOLDER_ID'
	},
	{
		name: '03 - Play & Learn',
		storageArea: 'play-learn',
		envKey: 'GOOGLE_DRIVE_PLAY_LEARN_FOLDER_ID'
	},
	{
		name: '04 - Lets Practice',
		storageArea: 'lets-practice',
		envKey: 'GOOGLE_DRIVE_LETS_PRACTICE_FOLDER_ID'
	},
	{
		name: '05 - Fresh Update',
		storageArea: 'fresh-update',
		envKey: 'GOOGLE_DRIVE_FRESH_UPDATE_FOLDER_ID'
	},
	{ name: '06 - QnA', storageArea: 'qna', envKey: 'GOOGLE_DRIVE_QNA_FOLDER_ID' },
	{ name: '99 - System', storageArea: 'system', envKey: 'GOOGLE_DRIVE_SYSTEM_FOLDER_ID' }
];
