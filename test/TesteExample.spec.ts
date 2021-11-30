// import { CreateFunction } from '../src/query/operator/CreateFunction';
// import { User } from './example/model/User';
import { Env, Environment } from 'roit-environment';
import { Repository1 } from './example/Repository1';

Environment.envOptions({ manuallyEnv: Env.TEST })
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

});