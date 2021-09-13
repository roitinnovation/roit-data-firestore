import { expect } from 'chai';
import 'mocha';
// import { CreateFunction } from '../src/query/operator/CreateFunction';
// import { User } from './example/model/User';
import { Repository1 } from './example/Repository1';
describe('TesteExample tests', () => {

  it('create simple test', async () => {

    const result: Repository1 = new Repository1

    const resultCreate = await result.create({ id: '1', name: 'asa', age: 41 })

    expect(resultCreate.id).to.equal("1")
    expect(resultCreate.name).to.equal("asa")
    expect(resultCreate.age).to.equal(41)

  });

  it('update simple test', async () => {

    const result: Repository1 = new Repository1

    const resultCreate = await result.update({ id: '1', name: 'Frango', age: 42 })

    expect(resultCreate.id).to.equal("1")
    expect(resultCreate.name).to.equal("Frango")
    expect(resultCreate.age).to.equal(42)

  });

  it('findById simple test', async () => {

    const result: Repository1 = new Repository1

    const resultFind = await result.findById('1')

    expect(resultFind?.id).to.equal("1")
    expect(resultFind?.name).to.equal("Frango")
    expect(resultFind?.age).to.equal(42)

  });

  it('findAll simple test', async () => {

    const result: Repository1 = new Repository1

    const resultfindAll = await result.findAll()

    console.log('resultfindAll', resultfindAll)

    expect(resultfindAll.length).to.equal(1)

    expect(resultfindAll[0].id).to.equal("1")
    expect(resultfindAll[0].name).to.equal("Frango")
    expect(resultfindAll[0].age).to.equal(42)

  });

  it('delete simple test', async () => {

    const result: Repository1 = new Repository1

    const resultDelete = await result.delete('1')

    expect(resultDelete).to.equal('1')

  });

  it('findById after delete simple test', async () => {

    const result: Repository1 = new Repository1

    const resultFind = await result.findById('1')

    expect(resultFind).to.equal(undefined)

  });


  it('findById after delete simple test', async () => {

    const result: Repository1 = new Repository1

    const resultFind = await result.findByName('1')

    expect(resultFind).to.equal(undefined)

  });

});