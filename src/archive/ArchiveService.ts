import { ArchiveConfig } from '../config/ArchiveConfig';
import { hasArchivePlugin, getArchivePlugin } from './index';

/**
 * Interface para opções de atualização de documento arquivado
 */
interface UpdateArchivedDocumentOptions {
  /** Se true, remove o documento arquivado após a atualização (desarquivamento) */
  unarchive?: boolean;
}

/**
 * Resultado de operações de arquivamento
 */
interface ArchiveOperationResult {
  success: boolean;
  message?: string;
  error?: Error;
}

/**
 * Logger interno para padronizar logs do ArchiveService
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
  /** ProjectId do Firestore sendo arquivado (para organização de paths) */
  private projectId: string;
  private isInitialized = false;
  private logger: ArchiveLogger;

  /**
   * Construtor privado para prevenir instanciação direta
   */
  private constructor() {
    // Construtor vazio - inicialização será feita em initialize()
  }

  public static async getInstance(): Promise<ArchiveService> {
    // Se já existe uma instância, retorna ela
    if (ArchiveService.instance && ArchiveService.instance.isInitialized) {
      return ArchiveService.instance;
    }

    // Se está inicializando, aguarda
    if (ArchiveService.isInitializing) {
      await ArchiveService.lock;
      return ArchiveService.instance!;
    }

    // Inicializa a instância
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
    
    // ProjectId do Firestore que está sendo arquivado (usado para paths no Storage)
    this.projectId = this.config.projectId;
    if (!this.projectId) {
      this.logger.warn('projectId não configurado - usando variável de ambiente');
      this.projectId = process.env.FIRESTORE_PROJECTID || process.env.GCP_PROJECT || '';
    }

    this.logger.debug(`Configuração: projectId=${this.projectId}, enabled=${this.config.enabled}`);

    if (!this.config.enabled) {
      this.logger.info('Arquivamento desabilitado via configuração');
      this.isInitialized = true;
      return;
    }

    if (!hasArchivePlugin()) {
      this.logger.warn('Plugin firestore-archive não registrado - arquivamento desabilitado');
    }

    this.isInitialized = true;
  }

  public static resetInstance(): void {
    ArchiveService.instance = null;
    ArchiveService.isInitializing = false;
  }

  /**
   * Verifica se o arquivamento está habilitado
   * Requer que o plugin firestore-archive esteja registrado
   */
  isEnabled(): boolean {
    // Arquivamento só funciona com plugin registrado
    return this.config.enabled && hasArchivePlugin();
  }

  /**
   * Verifica se um documento está arquivado
   */
  isDocumentArchived(documentData: any): boolean {
    if (!this.isEnabled()) {
      return false;
    }
    return getArchivePlugin().isDocumentArchived(documentData);
  }

  /**
   * Verifica se um documento está arquivado e recupera seus dados completos
   */
  async getArchivedDocument(collectionName: string, doc: any): Promise<Record<string, any> | null> {
    if (!this.isEnabled()) {
      return null;
    }

    const docId = doc.id;

    // Delega para plugin (isEnabled já garante que existe)
    return getArchivePlugin().getArchivedDocument(collectionName, docId, this.projectId);
  }

  /**
   * Atualiza um documento arquivado no Cloud Storage
   * Usado quando um documento arquivado é atualizado no Firestore
   * 
   * @param collectionName - Nome da collection
   * @param docId - ID do documento
   * @param newData - Novos dados a serem mesclados com o documento arquivado
   * @param options - Opções de atualização
   * @returns Resultado da operação e dados mesclados
   */
  async updateArchivedDocument(
    collectionName: string,
    docId: string,
    newData: Record<string, any>,
    options?: UpdateArchivedDocumentOptions
  ): Promise<{ result: ArchiveOperationResult; mergedData?: Record<string, any> }> {
    if (!this.isEnabled()) {
      return { result: { success: false, message: 'Arquivamento desabilitado ou plugin não registrado' } };
    }

    // Delega para plugin (isEnabled já garante que existe)
    return getArchivePlugin().updateArchivedDocument(
      collectionName,
      docId,
      newData,
      options,
      this.projectId
    );
  }

  /**
   * Deleta um documento arquivado do Cloud Storage
   * Usado quando um documento é permanentemente deletado ou restaurado
   * 
   * @param collectionName - Nome da collection
   * @param docId - ID do documento
   * @returns Resultado da operação
   */
  async deleteArchivedDocument(collectionName: string, docId: string): Promise<ArchiveOperationResult> {
    if (!this.isEnabled()) {
      return { success: false, message: 'Arquivamento desabilitado ou plugin não registrado' };
    }

    // Delega para plugin (isEnabled já garante que existe)
    return getArchivePlugin().deleteArchivedDocument(collectionName, docId, this.projectId);
  }

  /**
   * Recupera dados completos de um documento arquivado e o prepara para restauração
   * Combina os dados do stub (Firestore) com os dados arquivados (Storage)
   * 
   * @param collectionName - Nome da collection
   * @param stubData - Dados do stub no Firestore (inclui fbArchivedAt)
   * @returns Dados completos mesclados ou null se não encontrado
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
      this.logger.warn(`Dados arquivados não encontrados para documento: ${collectionName}/${stubData.id}`);
      return stubData; // Retorna stub se não encontrar dados arquivados
    }

    // Mesclar: dados do storage sobrescrevem o stub, exceto fbArchivedAt
    const { fbArchivedAt } = stubData;
    return { ...stubData, ...archivedData, fbArchivedAt };
  }

  /**
   * Limpa o cache de documentos arquivados
   * Delega para o plugin firestore-archive
   */
  async clearArchivedCache(collectionName?: string, docId?: string): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    await getArchivePlugin().invalidateCache(collectionName, docId);
  }

  /**
   * Retorna o projectId do Firestore sendo arquivado
   * (usado para organização de paths no Storage)
   */
  getProjectId(): string {
    return this.projectId;
  }
}