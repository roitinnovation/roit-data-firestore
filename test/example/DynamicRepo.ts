import { RepositoryOptions } from "../../src";
import { GenericRepository } from "../../src/config/GenericRepository";
import { Query } from "../../src/decorators/Query";
import { Paging } from "../../src/model/Paging";
import { User } from "./model/User";

export class DynamicRepo extends GenericRepository<User> {

    constructor(options: RepositoryOptions) {
        super(options)
    }

    @Query()
    findByName: (name: string) => Promise<Array<User>>

    @Query({ select: ['name'] })
    findByAge: (age: number) => Promise<Array<User>>

    @Query()
    findByNameAndAge: (name: string, age: number, paging?: Paging) => Promise<Array<User>>

    @Query()
    findByNameAndAgeAndOrderByIdDesc: (name: string, age: number) => Promise<Array<User>>

    findByNameAndId(name: string, id: string): Promise<Array<User>> {
        return this.query({
            query: [
                {
                    field: 'name',
                    operator: '==',
                    value: name
                },
                {
                    field: 'id',
                    operator: '==',
                    value: id
                }
            ]
        })
    }


    findByNameAndId2(name: string, id: string): Promise<Array<User>> {
        return this.query({
            query: [{ name }, { id }]
        })
    }
}