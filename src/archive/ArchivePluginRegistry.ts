import { IArchivePlugin } from './IArchivePlugin';

/**
 * Plugin NoOp - usado quando nenhum plugin de archive foi registrado
 * Todas as operações retornam valores padrão indicando que archive está desabilitado
 */
class NoOpArchivePlugin implements IArchivePlugin {
  isEnabled(): boolean {
    return false;
  }

  isDocumentArchived(_doc: Record<string, unknown>): boolean {
    return false;
  }

  async getArchivedDocument(_params: {
    collection: string;
    docId: string;
    archivePath: string;
    projectId?: string;
  }): Promise<Record<string, unknown> | null> {
    return null;
  }

  async updateArchivedDocument(_params: {
    collection: string;
    docId: string;
    newData: Record<string, unknown>;
    options?: { unarchive?: boolean };
    projectId?: string;
    archivePath: string;
  }): Promise<{
    result: { success: boolean; message?: string };
    mergedData?: Record<string, unknown>;
  }> {
    return {
      result: { success: false, message: 'Archive plugin not registered' },
    };
  }

  async deleteArchivedDocument(_params: {
    collection: string;
    docId: string;
    archivePath: string;
    projectId?: string;
  }): Promise<{ success: boolean; message?: string }> {
    return { success: false, message: 'Archive plugin not registered' };
  }

  async invalidateCache(_collection?: string, _docId?: string): Promise<void> {
    // No-op
  }
}

/**
 * Registry para o plugin de arquivamento
 * 
 * Permite que aplicações registrem um plugin de archive (como firestore-archive)
 * para habilitar funcionalidades de arquivamento de documentos.
 * 
 * @example
 * ```typescript
 * import { registerArchivePlugin, getArchivePlugin } from '@roit/roit-data-firestore';
 * import { createArchivePlugin } from 'firestore-archive';
 * 
 * // No início da aplicação
 * registerArchivePlugin(createArchivePlugin());
 * 
 * // Em qualquer lugar da aplicação
 * const plugin = getArchivePlugin();
 * if (plugin.isEnabled()) {
 *   const data = await plugin.getArchivedDocument({
 *     collection: 'orders',
 *     docId: 'abc123',
 *     archivePath: 'gs://bucket/project/orders/YYYY/MM/DD/{ts}_abc123.json.gz',
 *   });
 * }
 * ```
 */
class ArchivePluginRegistry {
  private static instance: ArchivePluginRegistry | null = null;
  private plugin: IArchivePlugin;

  private constructor() {
    // Inicializa com NoOp por padrão
    this.plugin = new NoOpArchivePlugin();
  }

  static getInstance(): ArchivePluginRegistry {
    if (!ArchivePluginRegistry.instance) {
      ArchivePluginRegistry.instance = new ArchivePluginRegistry();
    }
    return ArchivePluginRegistry.instance;
  }

  /**
   * Registra um plugin de archive
   */
  register(plugin: IArchivePlugin): void {
    this.plugin = plugin;
    console.log('[ArchivePluginRegistry] Archive plugin registered successfully');
  }

  /**
   * Retorna o plugin registrado (ou NoOp se nenhum foi registrado)
   */
  getPlugin(): IArchivePlugin {
    return this.plugin;
  }

  /**
   * Verifica se um plugin real foi registrado
   */
  hasPlugin(): boolean {
    return !(this.plugin instanceof NoOpArchivePlugin);
  }

  /**
   * Reseta o registry (útil para testes)
   */
  reset(): void {
    this.plugin = new NoOpArchivePlugin();
  }
}

// ========== Funções de conveniência ==========

/**
 * Registra um plugin de archive
 * Deve ser chamado no início da aplicação, antes de usar repositórios
 * 
 * @param plugin - Instância do plugin de archive
 * 
 * @example
 * ```typescript
 * import { registerArchivePlugin } from '@roit/roit-data-firestore';
 * import { createArchivePlugin } from 'firestore-archive';
 * 
 * // No bootstrap da aplicação
 * registerArchivePlugin(createArchivePlugin());
 * ```
 */
export function registerArchivePlugin(plugin: IArchivePlugin): void {
  ArchivePluginRegistry.getInstance().register(plugin);
}

/**
 * Retorna o plugin de archive registrado
 * Se nenhum plugin foi registrado, retorna um plugin NoOp que desabilita todas as operações
 */
export function getArchivePlugin(): IArchivePlugin {
  return ArchivePluginRegistry.getInstance().getPlugin();
}

/**
 * Verifica se um plugin de archive foi registrado
 */
export function hasArchivePlugin(): boolean {
  return ArchivePluginRegistry.getInstance().hasPlugin();
}

/**
 * Reseta o registry de plugins (útil para testes)
 */
export function resetArchivePlugin(): void {
  ArchivePluginRegistry.getInstance().reset();
}

export { ArchivePluginRegistry };

