import { Query } from "../decorators/Query";
import { Paging } from "../model/Paging";
import { MQuery, MQuerySimple } from '../model/MQuery';
import { ManualQueryHelper } from '../query/ManualQueryHelper';
export abstract class ReadonlyRepository<T> {

    @Query()
    findAll: (paging?: Paging) => Promise<T[]>

    @Query()
    findById: (id: string) => Promise<T> | undefined

    async query(query: Array<MQuery | MQuerySimple>): Promise<T[]> {
        const className = this.constructor.prototype.constructor.name
        return ManualQueryHelper.executeQueryManual(className, query)
    }
}