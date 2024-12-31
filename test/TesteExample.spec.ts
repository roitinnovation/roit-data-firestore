// import { CreateFunction } from '../src/query/operator/CreateFunction';
// import { User } from './example/model/User';
import { Repository1 } from './example/Repository1';
import { DynamicRepo } from './example/DynamicRepo';
import { User } from './example/model/User';

jest.setTimeout(50000)

process.env.ENV = 'test'

describe('TesteExample tests', () => {

  it('create simple test', async () => {

    const result: Repository1 = new Repository1

    const resultCreate = await result.create({ id: '1', name: 'asa', age: 41 })

    expect(resultCreate[0].id).toBe("1")
    expect(resultCreate[0].name).toBe("asa")
    expect(resultCreate[0].age).toBe(41)

  });


  it('delete simple test', async () => {

    const result: Repository1 = new Repository1

    const resultDelete = await result.delete('1')

    expect(resultDelete[0]).toBe('1')

  });

  it('findById after delete simple test', async () => {

    const result: Repository1 = new Repository1

    const resultFind = await result.findById('1')

    expect(resultFind).toBe(undefined)

  });

  it('generic repo test', async () => {

    const result: DynamicRepo = new DynamicRepo({
      collection: 'fb-data-test-dynamic',
      validateModel: User
    })

    const resultCreate = await result.create({ id: '1', name: 'asa', age: 41 })

    expect(resultCreate[0].id).toBe("1")
    expect(resultCreate[0].name).toBe("asa")
    expect(resultCreate[0].age).toBe(41)

  });

  it('queryRef method test', async () => {

    const result: DynamicRepo = new DynamicRepo({
      collection: 'fb-data-test-dynamic',
      validateModel: User
    })

    const resultQueryRef = await result.queryRef({
      query: [
        {
          field: "id",
          operator: "==",
          value: 1
        }
      ]
    })

    expect(resultQueryRef).not.toBeUndefined()

  });

});