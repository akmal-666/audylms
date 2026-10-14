// ============================================================
// Google Drive Service — Public API
// SERVER ONLY — barrel export for all Drive operations.
// ============================================================

export { getDriveClient, getGoogleDriveClient } from './client';

export {
	findFolder,
	getFolder,
	createFolder,
	findOrCreateFolder,
	initialiseFolderStructure
} from './folders';

export {
	getFileMetadata,
	listFiles,
	searchFiles,
	moveFile,
	deleteFile,
	getFileWebViewLink,
	getFileDownloadLink
} from './files';

export { uploadFile, initiateResumableUpload } from './upload';

export { downloadFileToBuffer, streamFile, exportGoogleFile } from './download';

export { createPermission, deletePermission, listPermissions } from './permissions';

export { validateFile, mimeTypeToAttachmentType } from './validation';

export type {
	StorageArea,
	DriveFileMetadata,
	UploadFileParams,
	UploadResult,
	SearchFilesParams,
	ValidationResult,
	ModuleFolder
} from './types';

export {
	ALLOWED_MIME_TYPES,
	ALL_ALLOWED_MIME_TYPES,
	DEFAULT_MAX_FILE_SIZE_BYTES,
	STORAGE_AREA_ENV_MAP,
	MODULE_FOLDERS
} from './types';
