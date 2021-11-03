// import { CreateFunction } from '../src/query/operator/CreateFunction';
// import { User } from './example/model/User';
import { Env, Environment } from 'roit-environment';
import { Repository1 } from './example/Repository1';

Environment.envOptions({ manuallyEnv: Env.TEST })
describe('TesteExample tests', () => {

  it('create simple test', async () => {

    const result: Repository1 = new Repository1

    const resultCreate = await result.create({ id: '1', name: 'asa', age: 41 })

    expect(resultCreate.id).toBe("1")
    expect(resultCreate.name).toBe("asa")
    expect(resultCreate.age).toBe(41)

  });

  it('update simple test', async () => {

    const result: Repository1 = new Repository1

    const resultCreate = await result.update({ id: '1', name: 'Frango', age: 42 })

    expect(resultCreate.id).toBe("1")
    expect(resultCreate.name).toBe("Frango")
    expect(resultCreate.age).toBe(42)

  });

  it('findById simple test', async () => {

    const result: Repository1 = new Repository1

    const resultFind = await result.findById('1')

    expect(resultFind?.id).toBe("1")
    expect(resultFind?.name).toBe("Frango")
    expect(resultFind?.age).toBe(42)

  });

  it('findAll simple test', async () => {

    const result: Repository1 = new Repository1

    const resultFindAll = await result.findAll()

    expect(resultFindAll.length).toBe(1)

    expect(resultFindAll[0].id).toBe("1")
    expect(resultFindAll[0].name).toBe("Frango")
    expect(resultFindAll[0].age).toBe(42)

  });

  it('findById before delete simple test', async () => {

    const result: Repository1 = new Repository1

    const resultFind = await result.findById('1')

    expect(resultFind?.age).toBe(42)
    expect(resultFind?.id).toBe("1")
    expect(resultFind?.name).toBe("Frango")
  });

  it('custom query (findByName) test', async () => {

    const result: Repository1 = new Repository1

    const resultFind = await result.findByName('Frango')

    expect(resultFind?.length).toBe(1)
    expect(resultFind[0]?.age).toBe(42)
    expect(resultFind[0]?.id).toBe("1")
    expect(resultFind[0]?.name).toBe("Frango")

    const resultFindAny = await result.findByName('AnyFrango')

    expect(resultFindAny?.length).toBe(0)
  });

  it('custom query (findByNameAndAge) test', async () => {

    const result: Repository1 = new Repository1

    const resultFind = await result.findByNameAndAge('Frango', 42)

    expect(resultFind?.length).toBe(1)
    expect(resultFind[0]?.age).toBe(42)
    expect(resultFind[0]?.id).toBe("1")
    expect(resultFind[0]?.name).toBe("Frango")

    const resultFindAny = await result.findByNameAndAge('Frango', 43)

    expect(resultFindAny?.length).toBe(0)
  });

  it('delete simple test', async () => {

    const result: Repository1 = new Repository1

    const resultDelete = await result.delete('1')

    expect(resultDelete).toBe('1')

  });

  it('findById after delete simple test', async () => {

    const result: Repository1 = new Repository1

    const resultFind = await result.findById('1')

    console.log(resultFind)

    expect(resultFind).toBe(undefined)

  });

});