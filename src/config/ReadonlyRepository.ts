import { Query } from "../decorators/Query";
import { Paging } from "../model/Paging";
import { ManualQueryHelper } from '../query/ManualQueryHelper';
import { Config } from '../model/MQuery';
import { QueryResult } from "../model";
export abstract class ReadonlyRepository<T> {

    @Query()
    findAll: (paging?: Paging) => Promise<T[]>

    @Query()
    findById: (id: string) => Promise<T> | undefined

    async query(config: Config): Promise<T[]> {
        const className = this.constructor.prototype.constructor.name
        return ManualQueryHelper.executeQueryManual(className, config)
    }

    async queryPaginated(config: Config): Promise<QueryResult<T>> {
        const className = this.constructor.prototype.constructor.name
        return ManualQueryHelper.executeQueryManualPaginated(className, config)
    }
}