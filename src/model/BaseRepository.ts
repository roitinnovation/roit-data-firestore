import { Query } from "../decorators/Query";


export abstract class BaseRepository<T> {

    @Query()
    create: (item: T) => Promise<T>

    @Query()
    update: (item: T) => Promise<T>

    @Query()
    delete: (id: string) => Promise<void>

    @Query()
    findAll: () => Promise<Array<T>>

    @Query()
    findById: (id: string) => Promise<T> | undefined
}