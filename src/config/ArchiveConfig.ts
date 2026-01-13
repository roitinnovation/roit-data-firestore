/**
 * Configurações mínimas para o ArchiveService no roit-data-firestore.
 * 
 * Nota: As configurações detalhadas de Storage e Cache agora são
 * responsabilidade do plugin firestore-archive.
 */

const parseBoolean = (value: unknown): boolean => {
  return value === true || value === 'true';
};

export interface ArchiveConfig {
  /** Se o arquivamento está habilitado */
  enabled: boolean;
  /** Habilita logs de debug */
  debug: boolean;
  /** 
   * ProjectId do Firestore que está sendo arquivado.
   * Usado para organizar os arquivos no Storage: {projectId}/{collection}/{docId}.json.gz
   */
  projectId: string;
}

export class ArchiveConfig {
  private static instance: ArchiveConfig | null = null;

  static getConfig(): ArchiveConfig {
    if (this.instance) {
      return this.instance;
    }

    this.instance = {
      enabled: parseBoolean(process.env.FIRESTORE_ARCHIVE_ENABLED),
      debug: parseBoolean(process.env.FIRESTORE_ARCHIVE_DEBUG),
      projectId: process.env.FIRESTORE_PROJECTID || process.env.GCP_PROJECT || '',
    };

    return this.instance;
  }

  /**
   * Reseta a configuração (útil para testes)
   */
  static reset(): void {
    this.instance = null;
  }
}
