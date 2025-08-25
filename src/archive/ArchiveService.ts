import { Storage } from '@google-cloud/storage';
import * as zlib from 'zlib';
import { Writable } from 'stream';
import { ArchiveConfig } from '../config/ArchiveConfig';
import { CacheResolver } from '../cache/CacheResolver';
import { CacheProviders } from '../model/CacheProviders';
import { Firestore } from "@google-cloud/firestore";

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
  private projectId: string;
  private firestore: any;
  private isInitialized = false;
  private isDebug = Boolean(ArchiveConfig.getConfig().debug);

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
    this.cacheResolver = CacheResolver.getInstance();
    this.projectId = this.config.projectId;

    if (this.isDebug) {
      console.log(`[ARCHIVE SERVICE] Configuração: ${JSON.stringify(this.config)}`);
    }

    if (!this.firestore) {
      this.firestore = new Firestore({
        projectId: 'roit-intern-infra'
      });
    }

    // REGISTRAR O ARCHIVESERVICE COMO REPOSITORY
    this.cacheResolver.addRepository('ArchiveService', {
      cacheExpiresInSeconds: 3600, // 1 hora de cache
      cacheProvider: CacheProviders.REDIS_ARCHIVE
    });

    if (!this.config.enabled) {
      console.log('ArchiveService: Arquivamento desabilitado');
      return;
    }

    this.storage = new Storage();
    this.bucketName = this.config.bucketName;

    if (!this.bucketName) {
      console.warn('ArchiveService: bucket_name não configurado');
    }
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

  private async pipeline(readStream: any, gunzip: any, writable: any): Promise<void> {
    return new Promise((resolve, reject) => {
      readStream.pipe(gunzip).pipe(writable);
      writable.on('finish', resolve);
      writable.on('error', reject);
    });
  }

  /**
   * Recupera documento arquivado em formato JSON
   */
  private async retrieveJsonDocument(collectionName: string, docId: string): Promise<Record<string, any> | null> {
    try {
      const filePath = `${this.projectId}/${collectionName}/${docId}.json.gz`;
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(filePath);

      const [exists] = await file.exists();
      if (!exists) {
        return null;
      }

      const readStream = file.createReadStream();
      const gunzip = zlib.createGunzip();

      const chunks: Buffer[] = [];
      await this.pipeline(
        readStream,
        gunzip,
        new Writable({
          write(chunk, _enc, cb) {
            chunks.push(chunk);
            cb();
          }
        })
      );

      const result = Buffer.concat(chunks).toString('utf-8');
      return JSON.parse(result);
    } catch (error) {
      console.warn(`Erro ao recuperar documento JSON arquivado ${collectionName}/${docId}:`, error);
      return null;
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
      console.warn('ArchiveService: bucket_name não configurado, não é possível recuperar documentos arquivados');
      return null;
    }

    const docId = doc.id;
    // Verificar cache se habilitado
    if (this.config.cache.enabled) {
      const cacheKey = `archived_${collectionName}_${docId}`;
      const cachedData = await this.cacheResolver.getCacheResult('ArchiveService', 'getArchivedDocument', cacheKey);
      if (cachedData) {
        if (this.isDebug) {
          console.log(`Cache hit para documento arquivado: ${collectionName}/${docId}`);
        }
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
          if (this.isDebug) {
            console.log(`Documento arquivado cacheado: ${collectionName}/${docId}`);
          }
        }

        return archivedData;
      }

    } catch (error) {
      console.warn(`Erro ao recuperar documento arquivado ${collectionName}/${docId}:`, error);
    }

    return null;
  }

  /**
   * Limpa o cache de documentos arquivados
   */
  async clearArchivedCache(collectionName?: string, docId?: string): Promise<void> {
    if (!this.config.cache.enabled) {
      return;
    }

    await this.cacheResolver.revokeArchiveCache(collectionName, docId);
  }

}