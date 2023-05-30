import { Query } from "../decorators/Query";
import { Config } from '../model/MQuery';
import { Paging } from "../model/Paging";
import { ManualQueryHelper } from '../query/ManualQueryHelper';
export abstract class BaseRepository<T> {

    /**
     * FindAll
     * Get all available records in the collection
     * @param paging
     */
    @Query()
    findAll: (paging?: Paging) => Promise<T[]>

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
}