/**
 * Interface para plugins de arquivamento
 * 
 * Esta interface define o contrato que plugins de archive devem implementar.
 * O plugin `firestore-archive` implementa esta interface.
 * 
 * @example
 * ```typescript
 * import { registerArchivePlugin } from '@roit/roit-data-firestore';
 * import { createArchivePlugin } from 'firestore-archive';
 * 
 * // Registrar o plugin no início da aplicação
 * registerArchivePlugin(createArchivePlugin());
 * ```
 */
export interface IArchivePlugin {
  /**
   * Verifica se o arquivamento está habilitado
   */
  isEnabled(): boolean;

  /**
   * Verifica se um documento está arquivado (tem fbArchivedAt)
   */
  isDocumentArchived(doc: Record<string, unknown>): boolean;

  /**
   * Recupera documento arquivado do Storage.
   *
   * IMPORTANTE (100% v3):
   * - `archivePath` é obrigatório (normalmente o `fbArchivePath` do stub).
   * - `docId` sozinho não identifica unicamente o objeto no Storage.
   */
  getArchivedDocument(params: {
    collection: string;
    docId: string;
    archivePath: string;
    projectId?: string;
  }): Promise<Record<string, unknown> | null>;

  /**
   * Atualiza documento arquivado (merge dados do Storage com novos dados)
   * 
   * @param collection - Nome da collection
   * @param docId - ID do documento
   * @param newData - Novos dados para mesclar
   * @param options - Opções (unarchive: true para remover do Storage)
   * @param projectId - ID do projeto (opcional)
   * @returns Resultado com dados mesclados
   */
  updateArchivedDocument(params: {
    collection: string;
    docId: string;
    newData: Record<string, unknown>;
    options?: { unarchive?: boolean };
    projectId?: string;
    archivePath?: string;
  }): Promise<{
    result: { success: boolean; message?: string; error?: Error };
    mergedData?: Record<string, unknown>;
  }>;

  /**
   * Deleta documento arquivado do Storage
   * 
   * @param collection - Nome da collection
   * @param docId - ID do documento
   * @param projectId - ID do projeto (opcional)
   * @returns Resultado da operação
   */
  deleteArchivedDocument(params: {
    collection: string;
    docId: string;
    projectId?: string;
    /**
     * Path completo do objeto no Storage (v3), normalmente o `fbArchivePath` do stub.
     */
    archivePath?: string;
  }): Promise<{ success: boolean; message?: string; error?: Error }>;

  /**
   * Invalida cache de documentos arquivados
   * 
   * @param collection - Nome da collection (opcional)
   * @param docId - ID do documento (opcional)
   */
  invalidateCache(collection?: string, docId?: string): Promise<void>;
}

/**
 * Campos de metadados de arquivamento no Firestore
 */
export const ARCHIVE_METADATA_FIELDS = {
  ARCHIVED_AT: 'fbArchivedAt',
  ARCHIVE_HASH: 'fbArchiveHash',
  ARCHIVE_PATH: 'fbArchivePath',
  RESTORED_AT: 'fbRestoredAt',
} as const;

