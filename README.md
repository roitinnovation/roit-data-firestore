# ROIT Data Firestore
Connect to firestore in a very easy and standardized way, using typescript and optionally [NestJs](https://docs.nestjs.com/)

## Usage Simple Example

#### Model Class

To validate the model use [class-validator](https://www.npmjs.com/package/class-validator), in execute create or update operation the rules will be validated

```
export class User {

    @IsString()
    id: string

    @IsString()
    @IsNotEmpty()
    name: string

    @IsNumber()
    age: number
}
```
#### Repository Class

```
import { Query } from "@roit/roit-data-firestore";
import { Repository } from "@roit/roit-data-firestore";
import { BaseRepository } from "@roit/roit-data-firestore";
import { User } from "./model/User";
import { Paging } from "@roit/roit-data-firestore";

@Repository({
    collection: 'fb-data-test',
    validateModel: User
})
// If use nest @Injectable()
export class Repository1 extends BaseRepository<User> {
    
    @Query()
    findByName: (name: string) => Promise<Array<User>>

    @Query({ oneRow: true })
    findByNameAndAge: (name: string, age: number, paging?: Paging) => Promise<User | undefined>

    @Query()
    findByNameAndAgeAndOrderByIdDesc: (name: string, age: number) => Promise<Array<User>>

    @Query({ select: ['name', 'age'] })
    findByAge: (age: number) => Promise<Array<User>>
}
```
## Decorators
import { Repository, Query, Cacheable } from "@roit/roit-data-firestore";

#### @Repository
The anotation Repository is responsible for register context from operator
```
@Repository({
    collection: 'collection', // Firestore collection name
    validateModel: Model // ref model from validate
})
```
#### @Query
The anotation Query is responsible from invoker the dynamic query creator and initialize implementation

```
@Query()
findByName: (name: string) => Promise<Array<User>>
```

#### @Cacheable
The anotation Cacheable is responsible from handler storage data in cache, local or using provider

```
@Cacheable({
    excludesMethods: [ // Excludes methods not to store data (optional, default [])
        'findById'
    ],
    cacheOnlyContainResults: true, // Cache data only query return value (optional, default true)
    cacheProvider: CacheProviders.LOCAL, // REDIS or LOCAL  (optional, default 'Local')
    includeOnlyMethods: [] // Includes only the methods that will be stored (optional, default []),
    cacheExpiresInSeconds: 60 // Cache expiration in seconds
})
```

## BaseRepository and ReadonlyRepository
To standardize the BaseRepository already provides the common methods for implementation

import { BaseRepository, Query, ReadonlyRepository } from "@roit/roit-data-firestore";
```
export abstract class BaseRepository<T> {

    @Query()
    findAll: (paging?: Paging) => Promise<T[]>

    @Query()
    findById: (id: Required<string>) => Promise<T | undefined>

    @Query()
    create: (item: T | Array<T>) => Promise<Array<T>>

    @Query()
    update: (items: T | Array<T>) => Promise<Array<T>>

    @Query()
    createOrUpdate: (items: T | Array<T>) => Promise<Array<T>>

    @Query()
    updatePartial: (id: Required<string>, itemPartial: Partial<T>) => Promise<void>

    @Query()
    delete: (id: Required<string> | Array<string>) => Promise<Array<string>>

    @Query()
    incrementField: (id: Required<string>, field: Required<string>, increment?: number) => Promise<void>
}

When you only need to read a collection, use ReadonlyRepository

export abstract class ReadonlyRepository<T> {

    @Query()
    findAll: (paging?: Paging) => Promise<T[]>

    @Query()
    findById: (id: string) => Promise<T> | undefined
}

```

## Dynamic query contractor
The dynamic construction of a query allows a method to be described in a standardized way and the library dynamically creates the concrete implementation

Ref: [Firstore Operators](https://firebase.google.com/docs/firestore/query-data/queries)

#### Supported keywords inside method 

| Keyword            | Sample                             | Query                                        |
| -------------------|------------------------------------| ----------------------------------------     |
| Iqual              | findByLastNameIqual or findByLastName | .where('lastName', '==', value)           |
| LessThan           | findByAgeLessThan                  | .where('age', '<', value)                    |
| LessThanEqual      | findByMonthLessThanEqual           | .where('month', '<=', value)                 |
| GreaterThan        | findByAgeUserGreaterThan           | .where('ageUser', '>', value)                |
| GreaterThanEqual   | findByAgeAppleGreaterThanEqual     | .where('ageApple', '>=', value)              |
| Different          | findByLastNameDifferent            | .where('lastName', '!=', value)              |
| ArrayContains      | findByCitysArrayContains           | .where('citys', 'array-contains', value)     |
| ArrayContainsAny   | findByCitysArrayContainsAny        | .where('citys', 'array-contains-any', value) |
| In                 | findByCitysIn                      | .where('citys', 'in', value)                 |
| NotIn              | findByFrangosNotIn                 | .where('frangos', 'not-in', value)           |
| OrderBy Desc       | findByNameAndOrderByNameDesc       | .where('name', '==', value).orderBy("name", "desc")|
| OrderBy Asc        | findByNameAndOrderByNameAsc        | .where('name', '==', value).orderBy("name", "asc")|
| Limit              | findByNameAndLimit10               | .where('name', '==', value).limit(10)        |

#### Example

```
@Query()
// When called example findByName('anyUser') result in query .where('name', '==', 'anyUser')
findByName: (name: string) => Promise<Array<User>>

@Query()
// When called example findByNameAndAge('anyUser', 15) result in query .where('name', '==', 'anyUser').where('age', '==', 15)
findByNameAndAge: (name: string, age: number) => Promise<Array<User>>

@Query()
// When called example findByNameAndAgeAndOrderByIdDesc('anyUser', 15) result in query .where('name', '==', 'anyUser').where('age', '==', 15).orderBy("id", "desc")
findByNameAndAgeAndOrderByIdDesc: (name: string, age: number) => Promise<Array<User>>
```

## Paging support

For any query it is possible to pass the paging information

Paging option
```
orderBy?: string = 'id'

orderByDirection?: Direction = 'asc'

cursor?: string | null = null

limit: number = 1000

```

#### Example

```
Any query

@Query()
findByNameAndAge: (name: string, age: number) => Promise<Array<User>>

Any query with paging

@Query()
findByNameAndAge: (name: string, age: number, paging?: Paging) => Promise<Array<User>>

```

#### Manual Query 

```

Use query() method preset in BaseRepository


findByNameAndId(name: string, id: string): Promise<Array<User>> {
    return this.query([
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
    ])
}

OR

findByNameAndId2(name: string, id: string): Promise<Array<User>> {
    return this.query([{ name }, { id }])
}

Full example

export class Repository1 extends BaseRepository<User> {

    @Query()
    findByName: (name: string) => Promise<Array<User>>

    @Query()
    findByNameAndAge: (name: string, age: number, paging?: Paging) => Promise<Array<User>>

    @Query()
    findByNameAndAgeAndOrderByIdDesc: (name: string, age: number) => Promise<Array<User>>

    findByNameAndId(name: string, id: string): Promise<Array<User>> {
        return this.query([
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
        ])
    }


    findByNameAndId2(name: string, id: string): Promise<Array<User>> {
        return this.query([{ name }, { id }])
    }
}
```

#### Paginated Query


```

Use queryPaginated() method preset in BaseRepository


findByNameAndId(name: string, id: string, paging: Paging): Promise<QueryResult<User>> {
    return this.queryPaginated({
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
        ],
        paging
    })
}

The return of this method is a QueryResult:

class QueryResult<T = any> {
    data: T[];
    totalItens: number | null;
}

```

#### Select Example

```
@Query({ select: ['name', 'id'] })
findByName: (name: string) => Promise<Array<User>>

findByNameAndId(name: string, id: string): Promise<Array<User>> {
    return this.query({
        query:[{name}, {id}],
        select: ['name']
    })
}
```

## Firestore read auditing with Big Query

GCP Firestore does not provide a way to visualize the number of reads per collection, so with this functionality it is possible to save all the reads of a Firestore collection into a BigQuery table or dispatch to a PubSub topic for further analysis.

Example (using env.yaml):

```
firestore:
    projectId: 'gcp-project-id'
    audit:
        enable: true
        endAt: '2023-01-19 15:02:10' (optional - after this date, the audit will stop)
        provider: 'PubSub' // PubSub or BigQuery (PubSub is the default option)
        pubSubTopic: 'your-topic'
```

