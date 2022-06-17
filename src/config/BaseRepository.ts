import { Query } from "../decorators/Query";
import { Paging } from "../model/Paging";
import { ManualQueryHelper } from '../query/ManualQueryHelper';
import { MQuery, MQuerySimple } from '../model/MQuery';
export abstract class BaseRepository<T> {

    @Query()
    findAll: (paging?: Paging) => Promise<T[]>

    @Query()
    findById: (id: Required<string>) => Promise<T | undefined>

    @Query()
    create: (item: T | Array<T>) => Promise<Array<T>>

    @Query()
    update: (items: T | Array<T>) => Promise<Array<T>>

    @Query()
    createOrUpdate: (items: T | Array<T>) => Promise<Array<T>>

    @Query()
    updatePartial: (id: Required<string>, itemPartial: Partial<T>) => Promise<void>

    @Query()
    delete: (id: Required<string> | Array<string>) => Promise<Array<string>>

    async query(query: Array<MQuery | MQuerySimple>): Promise<T[]> {
        const className = this.constructor.prototype.constructor.name
        return ManualQueryHelper.executeQueryManual(className, query)
    }
}