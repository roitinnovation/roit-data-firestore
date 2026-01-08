import { Storage } from '@google-cloud/storage';
import * as zlib from 'zlib';
import { ArchiveConfig } from '../config/ArchiveConfig';
import { CacheResolver } from '../cache/CacheResolver';
import { CacheProviders } from '../model/CacheProviders';
import { Firestore } from "@google-cloud/firestore";

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
  private readonly prefix = '[ArchiveServicess]';

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
  private storage: Storage;
  private bucketName: string;
  private config: ArchiveConfig;
  private cacheResolver: CacheResolver;
  /** ProjectId do Firestore sendo arquivado (para organização de paths) */
  private projectId: string;
  /** ProjectId onde o bucket do Storage está hospedado (sempre roit-intern-infra) */
  private storageProjectId: string;
  private firestore: Firestore;
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
    this.cacheResolver = CacheResolver.getInstance();
    
    // ProjectId do Firestore que está sendo arquivado (usado para paths no Storage)
    this.projectId = this.config.projectId;
    if (!this.projectId) {
      this.logger.warn('projectId não configurado - usando variável de ambiente');
      this.projectId = process.env.FIRESTORE_PROJECTID || process.env.GCP_PROJECT || '';
    }

    // ProjectId onde o bucket está hospedado (sempre roit-intern-infra por padrão)
    this.storageProjectId = this.config.storageProjectId;

    this.logger.debug(`Configuração: projectId=${this.projectId}, storageProjectId=${this.storageProjectId}, bucket=${this.config.bucketName}`);

    if (!this.firestore) {
      // Firestore usa o projectId da aplicação que está arquivando
      this.firestore = new Firestore({
        projectId: this.projectId || undefined
      });
    }

    // REGISTRAR O ARCHIVESERVICE COMO REPOSITORY
    this.cacheResolver.addRepository('ArchiveService', {
      cacheExpiresInSeconds: this.config.cache.expiresInSeconds || 3600,
      cacheProvider: CacheProviders.REDIS_ARCHIVE
    });

    if (!this.config.enabled) {
      this.logger.info('Arquivamento desabilitado');
      this.isInitialized = true;
      return;
    }

    // Storage usa o projectId onde o bucket está hospedado (roit-intern-infra)
    // Isso garante que a lib sempre acessa o bucket correto, independente do projeto que a utiliza
    this.storage = new Storage({
      projectId: this.storageProjectId
    });
    this.bucketName = this.config.bucketName;

    if (!this.bucketName) {
      this.logger.warn('bucket_name não configurado');
    }

    this.logger.debug(`Storage configurado: projeto=${this.storageProjectId}, bucket=${this.bucketName}`);
    this.isInitialized = true;
  }

  public static resetInstance(): void {
    ArchiveService.instance = null;
    ArchiveService.isInitializing = false;
  }

  /**
   * Verifica se o arquivamento está habilitado
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Verifica se um documento está arquivado
   */
  isDocumentArchived(documentData: any): boolean {
    if (!this.isEnabled()) {
      return false;
    }
    return documentData && documentData.fbArchivedAt;
  }

  // private async pipeline(readStream: any, gunzip: any, writable: any): Promise<void> {
  //   return new Promise((resolve, reject) => {
  //     readStream.pipe(gunzip).pipe(writable);
  //     writable.on('finish', resolve);
  //     writable.on('error', reject);
  //   });
  // }

  /**
   * Gera o caminho do arquivo no Cloud Storage
   */
  private getFilePath(collectionName: string, docId: string): string {
    return `${this.projectId}/${collectionName}/${docId}.json.gz`;
  }

  /**
   * Recupera documento arquivado em formato JSON
   */
  private async retrieveJsonDocument(collectionName: string, docId: string): Promise<Record<string, any> | null> {
    try {
      const filePath = this.getFilePath(collectionName, docId);
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(filePath);
      
      const [exists] = await file.exists();
      if (!exists) {
        this.logger.debug(`Documento não encontrado no Storage: ${filePath}`);
        return null;
      }

      // const readStream = file.createReadStream();
      // const gunzip = zlib.createGunzip();

      // const chunks: Uint8Array[] = [];
      // await this.pipeline(
      //   readStream,
      //   gunzip,
      //   new Writable({
      //     write(chunk: Buffer, _enc, cb) {
      //       chunks.push(new Uint8Array(chunk));
      //       cb();
      //     }
      //   })
      // );

      // const result = Buffer.concat(chunks).toString('utf-8');
      // return JSON.parse(result);

      const [buf] = await file.download();
      const raw = buf;
      const json = JSON.parse(raw.toString('utf-8'));
      // remove _meta para restaurar somente o conteúdo original
      if (json && typeof json === 'object' && '_meta' in json) {
          delete json._meta;
      }
      return json as Record<string, any>;
    } catch (error) {
      this.logger.error(`Erro ao recuperar documento JSON arquivado ${collectionName}/${docId}:`, error);
      return null;
    }
  }

  /**
   * Salva documento comprimido no Cloud Storage
   */
  private async saveJsonDocument(collectionName: string, docId: string, data: Record<string, any>): Promise<ArchiveOperationResult> {
    try {
      const filePath = this.getFilePath(collectionName, docId);
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(filePath);

      const jsonString = JSON.stringify(data);
      const compressedData = zlib.gzipSync(jsonString, { level: 9 });

      await file.save(compressedData, {
        resumable: false,
        contentType: 'application/gzip',
        gzip: false,
        metadata: {
          metadata: {
            updatedAt: new Date().toISOString()
          }
        }
      });

      this.logger.debug(`Documento salvo com sucesso: ${filePath}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Erro ao salvar documento ${collectionName}/${docId}:`, error);
      return { success: false, error: error as Error, message: (error as Error).message };
    }
  }

  /**
   * Verifica se um documento está arquivado e recupera seus dados completos
   */
  async getArchivedDocument(collectionName: string, doc: any): Promise<Record<string, any> | null> {
    if (!this.isEnabled()) {
      return null;
    }

    if (!this.bucketName) {
      this.logger.warn('bucket_name não configurado, não é possível recuperar documentos arquivados');
      return null;
    }

    const docId = doc.id;
    
    // Verificar cache se habilitado
    if (this.config.cache.enabled) {
      const cacheKey = `archived_${collectionName}_${docId}`;
      const cachedData = await this.cacheResolver.getCacheResult('ArchiveService', 'getArchivedDocument', cacheKey);
      if (cachedData) {
        this.logger.debug(`Cache hit para documento arquivado: ${collectionName}/${docId}`);
        return cachedData;
      }
    }

    try {
      const archivedData = await this.retrieveJsonDocument(collectionName, docId);
   
      if (archivedData) {
        // Salvar no cache se habilitado
        if (this.config.cache.enabled) {
          const cacheKey = `archived_${collectionName}_${docId}`;
          await this.cacheResolver.cacheResult('ArchiveService', 'getArchivedDocument', archivedData, cacheKey);
          this.logger.debug(`Documento arquivado cacheado: ${collectionName}/${docId}`);
        }

        return archivedData;
      }
    } catch (error) {
      this.logger.error(`Erro ao recuperar documento arquivado ${collectionName}/${docId}:`, error);
    }

    return null;
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
      return { result: { success: false, message: 'Arquivamento desabilitado' } };
    }

    if (!this.bucketName) {
      this.logger.warn('bucket_name não configurado, não é possível atualizar documento arquivado');
      return { result: { success: false, message: 'bucket_name não configurado' } };
    }

    try {
      // Recuperar dados atuais do Storage
      const currentData = await this.retrieveJsonDocument(collectionName, docId);
      
      if (!currentData) {
        this.logger.warn(`Documento arquivado não encontrado para atualização: ${collectionName}/${docId}`);
        return { result: { success: false, message: 'Documento arquivado não encontrado' } };
      }

      // Mesclar dados: dados arquivados + novos dados (novos sobrescrevem)
      const mergedData = { ...currentData, ...newData };
      
      // Remover metadados de arquivamento dos dados salvos
      delete mergedData.fbArchivedAt;

      if (options?.unarchive) {
        // Se for desarquivar, deletar do Storage após mesclar
        const deleteResult = await this.deleteArchivedDocument(collectionName, docId);
        if (!deleteResult.success) {
          this.logger.warn(`Falha ao deletar documento arquivado durante unarchive: ${collectionName}/${docId}`);
        }
      } else {
        // Caso contrário, atualizar o arquivo no Storage
        const saveResult = await this.saveJsonDocument(collectionName, docId, mergedData);
        if (!saveResult.success) {
          return { result: saveResult };
        }
      }

      // Invalidar cache
      await this.clearArchivedCache(collectionName, docId);

      this.logger.debug(`Documento arquivado atualizado com sucesso: ${collectionName}/${docId}`);
      return { result: { success: true }, mergedData };
    } catch (error) {
      this.logger.error(`Erro ao atualizar documento arquivado ${collectionName}/${docId}:`, error);
      return { result: { success: false, error: error as Error, message: (error as Error).message } };
    }
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
      return { success: false, message: 'Arquivamento desabilitado' };
    }

    if (!this.bucketName) {
      this.logger.warn('bucket_name não configurado, não é possível deletar documento arquivado');
      return { success: false, message: 'bucket_name não configurado' };
    }

    try {
      const filePath = this.getFilePath(collectionName, docId);
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(filePath);

      const [exists] = await file.exists();
      if (!exists) {
        this.logger.debug(`Documento arquivado não encontrado para deleção: ${filePath}`);
        return { success: true, message: 'Documento não existia' };
      }

      await file.delete();
      
      // Invalidar cache
      await this.clearArchivedCache(collectionName, docId);

      this.logger.debug(`Documento arquivado deletado com sucesso: ${filePath}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Erro ao deletar documento arquivado ${collectionName}/${docId}:`, error);
      return { success: false, error: error as Error, message: (error as Error).message };
    }
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
   */
  async clearArchivedCache(collectionName?: string, docId?: string): Promise<void> {
    if (!this.config?.cache?.enabled) {
      return;
    }

    await this.cacheResolver.revokeArchiveCache(collectionName, docId);
  }

  /**
   * Retorna o projectId do Firestore sendo arquivado
   * (usado para organização de paths no Storage)
   */
  getProjectId(): string {
    return this.projectId;
  }

  /**
   * Retorna o projectId onde o bucket do Storage está hospedado
   * (sempre roit-intern-infra por padrão)
   */
  getStorageProjectId(): string {
    return this.storageProjectId;
  }

  /**
   * Retorna o bucketName configurado
   */
  getBucketName(): string {
    return this.bucketName;
  }
}