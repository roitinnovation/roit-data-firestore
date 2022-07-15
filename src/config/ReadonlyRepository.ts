import { Query } from "../decorators/Query";
import { Paging } from "../model/Paging";
import { ManualQueryHelper } from '../query/ManualQueryHelper';
import { Config } from '../model/MQuery';
export abstract class ReadonlyRepository<T> {

    @Query()
    findAll: (paging?: Paging) => Promise<T[]>

    @Query()
    findById: (id: string) => Promise<T> | undefined

    async query(config: Config): Promise<T[]> {
        const className = this.constructor.prototype.constructor.name
        return ManualQueryHelper.executeQueryManual(className, config)
    }
}