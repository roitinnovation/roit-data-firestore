import { Query } from "../../src/decorators/Query";
import { Repository } from "../../src/decorators/Repository";
import { BaseRepository } from "../../src/model/BaseRepository";
import { User } from "./model/User";

@Repository({
    collection: 'fb-data-test'
})
export class Repository1 extends BaseRepository<User> {
    
    @Query()
    findByName: (name: string) => Promise<string>

    
}