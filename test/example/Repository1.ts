import { Query } from "../../src/decorators/Query";
import { Repository } from "../../src/decorators/Repository";
import { BaseRepository } from "../../src/config/BaseRepository";
import { User } from "./model/User";
import { Paging } from "../../src/model/Paging";
import { Cacheable } from "../../src/decorators/Cacheable";

@Repository({
    collection: 'fb-data-test',
    validateModel: User
})
@Cacheable({
    excludesMethods: [
        'findById'
    ],
})
export class Repository1 extends BaseRepository<User> {

    @Query()
    findByName: (name: string) => Promise<Array<User>>

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