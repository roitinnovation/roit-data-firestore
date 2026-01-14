import { ArchiveConfig } from '../config/ArchiveConfig';
import { hasArchivePlugin, getArchivePlugin, ARCHIVE_METADATA_FIELDS, ARCHIVE_MARKER_KEY, getArchiveMarker } from './index';

/**
 * Interface for options to update an archived document
 */
interface UpdateArchivedDocumentOptions {
  /** If true, removes the archived document after the update (unarchiving) */
  unarchive?: boolean;
}

/**
 * Result of archive operations
 */
interface ArchiveOperationResult {
  success: boolean;
  message?: string;
  error?: Error;
}

/**
 * Logger for ArchiveService
 */
class ArchiveLogger {
  private readonly isDebug: boolean;
  private readonly prefix = '[ArchiveServices]';

  constructor(debug: boolean) {
    this.isDebug = debug;
  }

  debug(message: string, ...args: any[]): void {
    if (this.isDebug) {
      console.debug(`${this.prefix} ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.isDebug) {
      console.info(`${this.prefix} ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`${this.prefix} ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(`${this.prefix} ${message}`, ...args);
  }
}

export class ArchiveService {
  // Singleton instance
  private static instance: ArchiveService | null = null;
  private static readonly lock = new Promise<void>((resolve) => resolve());
  private static isInitializing = false;

  // Instance properties
  private config: ArchiveConfig;
  /** ProjectId of the Firestore being archived (for path organization) */
  private projectId: string;
  private isInitialized = false;
  private logger: ArchiveLogger;

  /**
   * Private constructor to prevent direct instantiation
   */
  private constructor() {
    // Empty constructor - initialization will be done in initialize()
  }

  public static async getInstance(): Promise<ArchiveService> {
    // If an instance already exists, return it
    if (ArchiveService.instance && ArchiveService.instance.isInitialized) {
      return ArchiveService.instance;
    }

    // If initializing, wait
    if (ArchiveService.isInitializing) {
      await ArchiveService.lock;
      return ArchiveService.instance!;
    }

    // Initialize the instance
    ArchiveService.isInitializing = true;
    
    try {
      if (!ArchiveService.instance) {
        ArchiveService.instance = new ArchiveService();
      }
      
      await ArchiveService.instance.initialize();
      return ArchiveService.instance;
    } finally {
      ArchiveService.isInitializing = false;
    }
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.config = ArchiveConfig.getConfig();
    this.logger = new ArchiveLogger(this.config.debug);
    
    // ProjectId of the Firestore being archived (used for paths in Storage)
    this.projectId = this.config.projectId;
    if (!this.projectId) {
      this.logger.warn('projectId not configured - using environment variable');
      this.projectId = process.env.FIRESTORE_PROJECTID || process.env.GCP_PROJECT || '';
    }

    this.logger.debug(`Configuração: projectId=${this.projectId}, enabled=${this.config.enabled}`);

    if (!this.config.enabled) {
      this.logger.info('Archive disabled via configuration');
      this.isInitialized = true;
      return;
    }

    if (!hasArchivePlugin()) {
      this.logger.warn('Plugin firestore-archive not registered - archive disabled');
    }

    this.isInitialized = true;
  }

  public static resetInstance(): void {
    ArchiveService.instance = null;
    ArchiveService.isInitializing = false;
  }

  /**
   * Checks if the archive is enabled
   * Requires the firestore-archive plugin to be registered
   */
  isEnabled(): boolean {
    // Archive only works with registered plugin
    return this.config.enabled && hasArchivePlugin();
  }

  /**
   * Checks if a document is archived
   */
  isDocumentArchived(documentData: any): boolean {
    if (!this.isEnabled()) {
      return false;
    }
    return getArchivePlugin().isDocumentArchived(documentData);
  }

  /**
   * Returns the Cloud Storage path of the archived payload for a stub document.
   *
   * Marker-only: reads from `_rfa.archivePath`.
   * Returns the trimmed string or undefined when missing/invalid.
   */
  static getArchivePath(documentData: any): string | undefined {
    const marker = getArchiveMarker(documentData);
    if (!marker || typeof marker.archivePath !== 'string') return undefined;
    const trimmed = marker.archivePath.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  /**
   * Checks if a document is archived and retrieves its complete data
   */
  async getArchivedDocument(collectionName: string, doc: any): Promise<Record<string, any> | null> {
    if (!this.isEnabled()) {
      return null;
    }

    const docId = doc.id;
    const archivePath = ArchiveService.getArchivePath(doc) || '';

    if (!archivePath) {
      throw new Error(
        `ArchiveService.getArchivedDocument: ${ARCHIVE_METADATA_FIELDS.ARCHIVE_PATH} is required. collection=${collectionName} docId=${docId}`
      );
    }

    // Delegate to plugin (isEnabled already ensures it exists)
    return getArchivePlugin().getArchivedDocument({
      collection: collectionName,
      docId,
      archivePath,
      projectId: this.projectId,
    });
  }

  /**
   * Updates an archived document in Cloud Storage
   * Used when an archived document is updated in Firestore
   * 
   * @param collectionName - Collection name
   * @param docId - Document ID
   * @param newData - New data to merge with the archived document
   * @param archivePath - Full object path in Storage, usually the stub's `_rfa.archivePath`.
   * @param options - Update options
   * @returns Operation result and merged data
   */
  async updateArchivedDocument(
    collectionName: string,
    docId: string,
    newData: Record<string, any>,
    archivePath: string,
    options?: UpdateArchivedDocumentOptions
  ): Promise<{ result: ArchiveOperationResult; mergedData?: Record<string, any> }> {
    if (!this.isEnabled()) {
      return { result: { success: false, message: 'Arquivamento desabilitado ou plugin não registrado' } };
    }

    if (!archivePath || typeof archivePath !== 'string' || archivePath.trim().length === 0) {
      throw new Error(
        `ArchiveService.updateArchivedDocument: ${ARCHIVE_METADATA_FIELDS.ARCHIVE_PATH} is required. collection=${collectionName} docId=${docId}`
      );
    }

    // Delegate to plugin (isEnabled already ensures it exists)
    return getArchivePlugin().updateArchivedDocument({
      collection: collectionName,
      docId,
      newData,
      options,
      projectId: this.projectId,
      archivePath,
    });
  }

  /**
   * Deletes an archived document from Cloud Storage
   * Used when a document is permanently deleted or restored
   * 
   * @param collectionName - Collection name
   * @param docId - Document ID
   * @param archivePath - Full object path in Storage, usually the stub's `_rfa.archivePath`.
   * @returns Operation result
   */
  async deleteArchivedDocument(
    collectionName: string,
    docId: string,
    archivePath: string
  ): Promise<ArchiveOperationResult> {
    if (!this.isEnabled()) {
      return { success: false, message: 'Archive disabled or plugin not registered' };
    }

    if (!archivePath || typeof archivePath !== 'string' || archivePath.trim().length === 0) {
      throw new Error(
        `ArchiveService.deleteArchivedDocument: ${ARCHIVE_METADATA_FIELDS.ARCHIVE_PATH} is required. collection=${collectionName} docId=${docId}`
      );
    }

    // Delegate to plugin (isEnabled already ensures it exists)
    return getArchivePlugin().deleteArchivedDocument({
      collection: collectionName,
      docId,
      projectId: this.projectId,
      archivePath,
    });
  }

  /**
   * Retrieves complete data of an archived document and prepares it for restoration
   * Combines the stub data (Firestore) with the archived data (Storage)
   * 
   * @param collectionName - Collection name
   * @param stubData - Stub data in Firestore (includes _rfa)
   * @returns Complete merged data or null if not found
   */
  async getCompleteArchivedDocument(
    collectionName: string,
    stubData: Record<string, any>
  ): Promise<Record<string, any> | null> {
    if (!this.isDocumentArchived(stubData)) {
      return stubData;
    }

    const archivedData = await this.getArchivedDocument(collectionName, stubData);
    
    if (!archivedData) {
      this.logger.warn(`Archived data not found for document: ${collectionName}/${stubData.id}`);
      return stubData; // Return stub if archived data is not found
    }

    // Merge: storage data overwrites the stub, except the marker _rfa
    const marker = stubData?.[ARCHIVE_MARKER_KEY];
    return { ...stubData, ...archivedData, [ARCHIVE_MARKER_KEY]: marker };
  }

  /**
   * Clears the cache of archived documents
   * Delegates to the firestore-archive plugin
   */
  async clearArchivedCache(collectionName?: string, docId?: string): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    await getArchivePlugin().invalidateCache(collectionName, docId);
  }

  /**
   * Returns the projectId of the Firestore being archived
   * (used for path organization in Storage)
   */
  getProjectId(): string {
    return this.projectId;
  }
}