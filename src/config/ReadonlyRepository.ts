import { Query } from "../decorators/Query";
import { Paging } from "../model/Paging";
export abstract class ReadonlyRepository<T> {

    @Query()
    findAll: (paging?: Paging) => Promise<T[]>

    @Query()
    findById: (id: string) => Promise<T> | undefined
}