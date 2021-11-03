import { TransformMethodFromQuery } from '../src/query/TransformMethodFromQuery';
describe('TransformMethodFromQuery test', () => {

  it('operator LessThan', async () => {

    const result = TransformMethodFromQuery.extractQuery('findByAgeLessThan')

    expect(result.length).toBe(1)

    expect(result[0].attribute).toBe('age')
    expect(result[0].operator).toContain('<')
    expect(result[0].operatorKey).toBe('LessThan')
  });

  it('operator LessThanEqual', async () => {

    const result = TransformMethodFromQuery.extractQuery('findByMonthLessThanEqual')

    expect(result.length).toBe(1)

    expect(result[0].attribute).toBe('month')
    expect(result[0].operator).toContain('<=')
    expect(result[0].operatorKey).toBe('LessThanEqual')
  });

  it('operator Iqual', async () => {

    const result = TransformMethodFromQuery.extractQuery('findByLastNameIqual')

    expect(result.length).toBe(1)

    expect(result[0].attribute).toBe('lastName')
    expect(result[0].operator).toContain('==')
    expect(result[0].operatorKey).toBe('Iqual')

    const result2 = TransformMethodFromQuery.extractQuery('findByLastName')

    expect(result2.length).toBe(1)

    expect(result2[0].attribute).toBe('lastName')
    expect(result2[0].operator).toContain('==')
    expect(result2[0].operatorKey).toBe('Iqual')
  });

  it('operator GreaterThan', async () => {

    const result = TransformMethodFromQuery.extractQuery('findByAgeFrangoGreaterThan')

    expect(result.length).toBe(1)

    expect(result[0].attribute).toBe('ageFrango')
    expect(result[0].operator).toContain('>')
    expect(result[0].operatorKey).toBe('GreaterThan')
  });

  it('operator GreaterThanEqual', async () => {

    const result = TransformMethodFromQuery.extractQuery('findByAgeAppleGreaterThanEqual')

    expect(result.length).toBe(1)

    expect(result[0].attribute).toBe('ageApple')
    expect(result[0].operator).toContain('>=')
    expect(result[0].operatorKey).toBe('GreaterThanEqual')
  });

  it('operator Different', async () => {

    const result = TransformMethodFromQuery.extractQuery('findByLastNameDifferent')

    expect(result.length).toBe(1)

    expect(result[0].attribute).toBe('lastName')
    expect(result[0].operator).toContain('!=')
    expect(result[0].operatorKey).toBe('Different')
  });

  it('operator ArrayContains', async () => {

    const result = TransformMethodFromQuery.extractQuery('findByCitysArrayContains')

    expect(result.length).toBe(1)

    expect(result[0].attribute).toBe('citys')
    expect(result[0].operator).toContain('array-contains')
    expect(result[0].operatorKey).toBe('ArrayContains')
  });

  it('operator ArrayContainsAny', async () => {

    const result = TransformMethodFromQuery.extractQuery('findByCitysArrayContainsAny')

    expect(result.length).toBe(1)

    expect(result[0].attribute).toBe('citys')
    expect(result[0].operator).toContain('array-contains-any')
    expect(result[0].operatorKey).toBe('ArrayContainsAny')
  });

  it('operator In', async () => {

    const result = TransformMethodFromQuery.extractQuery('findByCitysIn')

    expect(result.length).toBe(1)

    expect(result[0].attribute).toBe('citys')
    expect(result[0].operator).toContain('in')
    expect(result[0].operatorKey).toBe('In')
  });

  it('operator NotIn', async () => {

    const result = TransformMethodFromQuery.extractQuery('findByFrangosNotIn')

    expect(result.length).toBe(1)

    expect(result[0].attribute).toBe('frangos')
    expect(result[0].operator).toContain('not-in')
    expect(result[0].operatorKey).toBe('NotIn')
  });

  it('operator OrderByDesc', async () => {

    const result = TransformMethodFromQuery.extractQuery('findByNameAndOrderByNameDesc')

    expect(result[0].attribute).toBe('name')
    expect(result[0].operator).toContain('.where')
    expect(result[0].operatorKey).toBe('Iqual')

    expect(result[1].attribute).toBe('name')
    expect(result[1].operator).toContain('.orderBy')
    expect(result[1].operator).toContain('desc')
    expect(result[1].operatorKey).toBe('OrderBy')
  });

  it('operator OrderByAsc', async () => {

    const result = TransformMethodFromQuery.extractQuery('findByNameAndOrderByNameAsc')

    expect(result.length).toBe(2)

    expect(result[0].attribute).toBe('name')
    expect(result[0].operator).toContain('.where')
    expect(result[0].operatorKey).toBe('Iqual')

    expect(result[1].attribute).toBe('name')
    expect(result[1].operator).toContain('.orderBy')
    expect(result[1].operator).toContain('asc')
    expect(result[1].operatorKey).toBe('OrderBy')
  });


  it('operator Limit', async () => {

    const result = TransformMethodFromQuery.extractQuery('findByNameAndLimit10')
    
    expect(result.length).toBe(2)

    expect(result[0].attribute).toBe('name')
    expect(result[0].operator).toBe('.where(\'ATRIBUTE\', \'==\', VALUE)')
    expect(result[0].operatorKey).toBe('Iqual')

    expect(result[1].attribute).toBe('10')
    expect(result[1].operator).toContain('.limit')
    expect(result[1].operatorKey).toBe('Limit')
  });

  it('operator compound query iqual,LessThan,OrderByAsc', async () => {

    const result = TransformMethodFromQuery.extractQuery('findByNameAndAgeLessThanAndOrderByNameAsc')

    expect(result.length).toBe(3)

    expect(result[0].attribute).toBe('name')
    expect(result[0].operator).toContain('==')
    expect(result[0].operatorKey).toBe('Iqual')

    expect(result[1].attribute).toBe('age')
    expect(result[1].operator).toContain('<')
    expect(result[1].operatorKey).toBe('LessThan')

    expect(result[2].attribute).toBe('name')
    expect(result[2].operator).toContain('orderBy')
    expect(result[2].operatorKey).toBe('OrderBy')
  });

  it('operator compound query iqual', async () => {

    const result = TransformMethodFromQuery.extractQuery('findByNameAndAge')

    expect(result.length).toBe(2)

    expect(result[0].attribute).toBe('name')
    expect(result[0].operator).toContain('==')
    expect(result[0].operatorKey).toBe('Iqual')

    expect(result[1].attribute).toBe('age')
    expect(result[1].operator).toContain('==')
    expect(result[1].operatorKey).toBe('Iqual')
  });


});