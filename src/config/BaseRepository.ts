import { ArchiveService } from "../archive/ArchiveService";
import { Query } from "../decorators/Query";
import { QueryResult } from "../model";
import { Aggregate } from "../model/Aggregate";
import { FindDataConfig } from "../model/FindDataConfig";
import { Config, MQuery, MQuerySimple } from '../model/MQuery';
import { ManualQueryHelper } from '../query/ManualQueryHelper';
export abstract class BaseRepository<T> {

    /**
     * FindAll
     * Get all available records in the collection
     * @param paging
     */
    @Query()
    findAll: (paging?: FindDataConfig) => Promise<T[]>

    /**
     * FindById
     * Get registe
     */
    @Query()
    findById: (id: Required<string>) => Promise<T | undefined>

    @Query()
    create: (item: T | Array<T>) => Promise<Array<T>>

    @Query()
    update: (items: T | Array<T>) => Promise<Array<T>>

    @Query()
    createOrUpdate: (items: T | Array<T>) => Promise<Array<T>>

    /**
     * Update partial data
     */
    @Query()
    updatePartial: (id: Required<string>, itemPartial: Partial<T>) => Promise<void>

    /**
     * Delete Row or Rows in bath
     * @param id
     */
    @Query()
    delete: (id: Required<string> | Array<string>) => Promise<Array<string>>

    /**
     * Distributed counters
     * https://firebase.google.com/docs/firestore/solutions/counters#web
     * 
     * @param field field from increment
     * @param increment value increment, default value 1
     */
    @Query()
    incrementField: (id: Required<string>, field: Required<string>, increment?: number) => Promise<void>

    async query(config: Config): Promise<T[]> {
        const className = this.constructor.prototype.constructor.name
        return ManualQueryHelper.executeQueryManual(className, config)
    }

    async queryPaginated(config: Config): Promise<QueryResult<T>> {
        const className = this.constructor.prototype.constructor.name
        return ManualQueryHelper.executeQueryManualPaginated(className, config)
    }

    @Query()
    count: (config: { query: Array<MQuery | MQuerySimple> }) => Promise<number>

    @Query()
    sum: (config: { attributeSum: string, query: Array<MQuery | MQuerySimple> }) => Promise<number>

    @Query()
    average: (config: { attributeAvg: string, query: Array<MQuery | MQuerySimple> }) => Promise<number>

    @Query()
    aggregation: (config: { query?: Array<MQuery | MQuerySimple>, aggregations: Array<Aggregate> }) => Promise<{ [k: string]: string | number }>

    /**
     * Limpa o cache de documentos arquivados
     * @param collectionName Nome da collection (opcional)
     * @param docId ID do documento (opcional)
     */
    async clearArchivedCache(collectionName?: string, docId?: string): Promise<void> {
        const archiveService = await ArchiveService.getInstance();
        await archiveService.clearArchivedCache(collectionName, docId);
    }
}