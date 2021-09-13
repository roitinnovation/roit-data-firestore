import { expect } from 'chai';
import 'mocha';
import { TransformMethodFromQuery } from '../src/query/TransformMethodFromQuery';
describe('TransformMethodFromQuery test', () => {

  it('operator LessThan', async () => {

    const result = TransformMethodFromQuery.extractQuery('findByAgeLessThan')

    expect(result.length).to.equal(1)

    expect(result[0].attribute).to.equal('age')
    expect(result[0].operator).to.contain('<')
    expect(result[0].operatorKey).to.equal('LessThan')
  });

  it('operator LessThanEqual', async () => {

    const result = TransformMethodFromQuery.extractQuery('findByMonthLessThanEqual')

    expect(result.length).to.equal(1)

    expect(result[0].attribute).to.equal('month')
    expect(result[0].operator).to.contain('<=')
    expect(result[0].operatorKey).to.equal('LessThanEqual')
  });

  it('operator Iqual', async () => {

    const result = TransformMethodFromQuery.extractQuery('findByLastNameIqual')

    expect(result.length).to.equal(1)

    expect(result[0].attribute).to.equal('lastName')
    expect(result[0].operator).to.contain('==')
    expect(result[0].operatorKey).to.equal('Iqual')

    const result2 = TransformMethodFromQuery.extractQuery('findByLastName')

    expect(result2.length).to.equal(1)

    expect(result2[0].attribute).to.equal('lastName')
    expect(result2[0].operator).to.contain('==')
    expect(result2[0].operatorKey).to.equal('Iqual')
  });

  it('operator GreaterThan', async () => {

    const result = TransformMethodFromQuery.extractQuery('findByAgeFrangoGreaterThan')

    expect(result.length).to.equal(1)

    expect(result[0].attribute).to.equal('ageFrango')
    expect(result[0].operator).to.contain('>')
    expect(result[0].operatorKey).to.equal('GreaterThan')
  });

  it('operator GreaterThanEqual', async () => {

    const result = TransformMethodFromQuery.extractQuery('findByAgeAppleGreaterThanEqual')

    expect(result.length).to.equal(1)

    expect(result[0].attribute).to.equal('ageApple')
    expect(result[0].operator).to.contain('>=')
    expect(result[0].operatorKey).to.equal('GreaterThanEqual')
  });

  it('operator Different', async () => {

    const result = TransformMethodFromQuery.extractQuery('findByLastNameDifferent')

    expect(result.length).to.equal(1)

    expect(result[0].attribute).to.equal('lastName')
    expect(result[0].operator).to.contain('!=')
    expect(result[0].operatorKey).to.equal('Different')
  });

  it('operator ArrayContains', async () => {

    const result = TransformMethodFromQuery.extractQuery('findByCitysArrayContains')

    expect(result.length).to.equal(1)

    expect(result[0].attribute).to.equal('citys')
    expect(result[0].operator).to.contain('array-contains')
    expect(result[0].operatorKey).to.equal('ArrayContains')
  });

  it('operator ArrayContainsAny', async () => {

    const result = TransformMethodFromQuery.extractQuery('findByCitysArrayContainsAny')

    expect(result.length).to.equal(1)

    expect(result[0].attribute).to.equal('citys')
    expect(result[0].operator).to.contain('array-contains-any')
    expect(result[0].operatorKey).to.equal('ArrayContainsAny')
  });

  it('operator In', async () => {

    const result = TransformMethodFromQuery.extractQuery('findByCitysIn')

    expect(result.length).to.equal(1)

    expect(result[0].attribute).to.equal('citys')
    expect(result[0].operator).to.contain('in')
    expect(result[0].operatorKey).to.equal('In')
  });

  it('operator NotIn', async () => {

    const result = TransformMethodFromQuery.extractQuery('findByFrangosNotIn')

    expect(result.length).to.equal(1)

    expect(result[0].attribute).to.equal('frangos')
    expect(result[0].operator).to.contain('not-in')
    expect(result[0].operatorKey).to.equal('NotIn')
  });

  it('operator OrderByDesc', async () => {

    const result = TransformMethodFromQuery.extractQuery('findByNameOrderByDesc')

    expect(result.length).to.equal(1)

    expect(result[0].attribute).to.equal('name')
    expect(result[0].operator).to.contain('orderBy')
    expect(result[0].operatorKey).to.equal('OrderByDesc')
  });

  it('operator OrderByAsc', async () => {

    const result = TransformMethodFromQuery.extractQuery('findByNameOrderByAsc')

    expect(result.length).to.equal(1)

    expect(result[0].attribute).to.equal('name')
    expect(result[0].operator).to.contain('orderBy')
    expect(result[0].operatorKey).to.equal('OrderByAsc')
  });


  it('operator Limit', async () => {

    const result = TransformMethodFromQuery.extractQuery('findByNameAndLimit10')
    
    expect(result.length).to.equal(2)

    expect(result[0].attribute).to.equal('name')
    expect(result[0].operator).to.equal('.where(\'ATRIBUTE\', \'==\', VALUE)')
    expect(result[0].operatorKey).to.equal('Iqual')

    expect(result[1].attribute).to.equal('10')
    expect(result[1].operator).to.contain('.limit')
    expect(result[1].operatorKey).to.equal('Limit')
  });

  it('operator compound query iqual,LessThan,OrderByAsc', async () => {

    const result = TransformMethodFromQuery.extractQuery('findByNameAndAgeLessThanAndOrderByAscName')

    expect(result.length).to.equal(3)

    expect(result[0].attribute).to.equal('name')
    expect(result[0].operator).to.contain('==')
    expect(result[0].operatorKey).to.equal('Iqual')

    expect(result[1].attribute).to.equal('age')
    expect(result[1].operator).to.contain('<')
    expect(result[1].operatorKey).to.equal('LessThan')

    expect(result[2].attribute).to.equal('name')
    expect(result[2].operator).to.contain('orderBy')
    expect(result[2].operatorKey).to.equal('OrderByAsc')
  });

  it('operator compound query iqual', async () => {

    const result = TransformMethodFromQuery.extractQuery('findByNameAndAge')

    expect(result.length).to.equal(2)

    expect(result[0].attribute).to.equal('name')
    expect(result[0].operator).to.contain('==')
    expect(result[0].operatorKey).to.equal('Iqual')

    expect(result[1].attribute).to.equal('age')
    expect(result[1].operator).to.contain('==')
    expect(result[1].operatorKey).to.equal('Iqual')
  });


});