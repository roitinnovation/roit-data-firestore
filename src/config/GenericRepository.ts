import { bindRepositoryInstance } from "../decorators/Repository";
import { RepositoryOptions } from "../model";
import { BaseRepository } from "./BaseRepository";

export abstract class GenericRepository<T> extends BaseRepository<T> {

    constructor(options: RepositoryOptions) {
        super()
        const className = this.constructor.name
        bindRepositoryInstance(options, className, this.constructor)
    }
}