import { Query } from "../../src/decorators/Query";
import { Repository } from "../../src/decorators/Repository";
import { BaseRepository } from "../../src/config/BaseRepository";
import { User } from "./model/User";

@Repository({
    collection: 'fb-data-test',
    validateModel: User
})
export class Repository1 extends BaseRepository<User> {
    
    @Query()
    findByName: (name: string) => Promise<Array<User>>

    @Query()
    findByNameAndAge: (name: string, age: number) => Promise<Array<User>>

    @Query()
    findByNameAndAgeAndOrderByIdDesc: (name: string, age: number) => Promise<Array<User>>
}