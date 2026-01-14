/**
 * Interface for archive plugins
 * 
 * This interface defines the contract that archive plugins must implement.
 * The `firestore-archive` plugin implements this interface.
 * 
 * @example
 * ```typescript
 * import { registerArchivePlugin } from '@roit/roit-data-firestore';
 * import { createArchivePlugin } from 'firestore-archive';
 * 
 * // Register the plugin at the beginning of the application
 * registerArchivePlugin(createArchivePlugin());
 * ```
 */
export interface IArchivePlugin {
  /**
   * Checks if the archive is enabled
   */
  isEnabled(): boolean;

  /**
   * Checks if a document is archived (has _rfa.archivedAt)
   */
  isDocumentArchived(doc: Record<string, unknown>): boolean;

  /**
   * Retrieves an archived document from Storage.
   *
   * @param collection - Collection name
   * @param docId - Document ID
   * @param archivePath - Full object path in Storage, usually the stub's `_rfa.archivePath`.
   * @param projectId - Project ID (optional)
   * @returns Operation result
   */
  getArchivedDocument(params: {
    collection: string;
    docId: string;
    archivePath: string;
    projectId?: string;
  }): Promise<Record<string, unknown> | null>;

  /**
   * Updates an archived document (merge Storage data with new data)
   * 
   * @param collection - Collection name
   * @param docId - Document ID
   * @param newData - New data to merge
   * @param options - Options (unarchive: true to remove from Storage)
   * @param projectId - Project ID (optional)
   * @param archivePath - Full object path in Storage, usually the stub's `_rfa.archivePath`. Required when unarchive=true
   * @returns Merged data
   */
  updateArchivedDocument(params: {
    collection: string;
    docId: string;
    newData: Record<string, unknown>;
    options?: { unarchive?: boolean };
    projectId?: string;
    archivePath: string;
  }): Promise<{
    result: { success: boolean; message?: string; error?: Error };
    mergedData?: Record<string, unknown>;
  }>;

  /**
   * Deletes an archived document from Storage
   * 
   * @param collection - Collection name
   * @param docId - Document ID
   * @param projectId - Project ID (optional)
   * @returns Operation result
   */
  deleteArchivedDocument(params: {
    collection: string;
    docId: string;
    archivePath: string;
    projectId?: string;
  }): Promise<{ success: boolean; message?: string; error?: Error }>;

  /**
   * Invalidates the cache of archived documents
   * 
   * @param collection - Collection name (optional)
   * @param docId - Document ID (optional)
   */
  invalidateCache(collection?: string, docId?: string): Promise<void>;
}

/**
 * Archive marker key in Firestore (marker-only).
 */
export const ARCHIVE_MARKER_KEY = '_rfa' as const;

export type ArchiveMarker = {
  archivedAt?: string;
  archiveHash?: string;
  archivePath?: string;
  restoredAt?: string;
  version?: number | string;
};

export function getArchiveMarker(doc: Record<string, unknown> | null | undefined): ArchiveMarker | null {
  if (!doc) return null;
  const marker = (doc as Record<string, unknown>)[ARCHIVE_MARKER_KEY];
  if (!marker || typeof marker !== 'object') return null;
  return marker as ArchiveMarker;
}

/**
 * Paths (dot-notation) for archive metadata in Firestore.
 * Use these values in Firestore queries/updates; do not use for direct indexing in JS objects.
 */
export const ARCHIVE_METADATA_FIELDS = {
  ARCHIVED_AT: `${ARCHIVE_MARKER_KEY}.archivedAt`,
  ARCHIVE_HASH: `${ARCHIVE_MARKER_KEY}.archiveHash`,
  ARCHIVE_PATH: `${ARCHIVE_MARKER_KEY}.archivePath`,
  RESTORED_AT: `${ARCHIVE_MARKER_KEY}.restoredAt`,
  VERSION: `${ARCHIVE_MARKER_KEY}.version`,
} as const;

