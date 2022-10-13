import { CacheResolver } from "../src/cache/CacheResolver";

describe('CacheResolver tests', () => {

  it('simple cache storage', async () => {

    const repository = 'AnyRepository'
    const anyMethod = 'anyMethod'
    const anyValueParam = 'value1'

    CacheResolver.getInstance().addRepository(repository)

    await CacheResolver.getInstance().cacheResult(repository, anyMethod, 10, anyValueParam)

    const result = await CacheResolver.getInstance().getCacheResult(repository, anyMethod, anyValueParam)
    const result2 = await CacheResolver.getInstance().getCacheResult(repository, anyMethod, 'value3')

    expect(result).toBe(10)
    expect(result2).toBeUndefined()
  });

  it('cache only result storage', async () => {

    const repository = 'AnyRepository1'
    const anyMethod = 'anyMethod'
    const anyValueParam = 'value1'
    const anyValueParam2 = 'value2'
    const anyValueParam3 = 'value3'
    const anyValueParam4 = 'value4'
    const anyValueParam5 = 'value5'

    CacheResolver.getInstance().addRepository(repository, {
        cacheOnlyContainResults: true
    })

    await CacheResolver.getInstance().cacheResult(repository, anyMethod, 10, anyValueParam)
    await CacheResolver.getInstance().cacheResult(repository, anyMethod, [], anyValueParam2)
    await CacheResolver.getInstance().cacheResult(repository, anyMethod, [ 'cookie' ], anyValueParam3)
    await CacheResolver.getInstance().cacheResult(repository, anyMethod, null, anyValueParam4)
    await CacheResolver.getInstance().cacheResult(repository, anyMethod, undefined, anyValueParam5)

    const result = await CacheResolver.getInstance().getCacheResult(repository, anyMethod, anyValueParam)
    expect(result).toBe(10)

    const result2 = await CacheResolver.getInstance().getCacheResult(repository, anyMethod, anyValueParam2)
    expect(result2).toBeUndefined()

    const result3 = await CacheResolver.getInstance().getCacheResult(repository, anyMethod, anyValueParam3)
    expect(Array.isArray(result3)).toBeTruthy()
    expect(result3?.length).toBe(1)

    const result4 = await CacheResolver.getInstance().getCacheResult(repository, anyMethod, anyValueParam4)
    expect(result4).toBeUndefined()

    const result5 = await CacheResolver.getInstance().getCacheResult(repository, anyMethod, anyValueParam5)
    expect(result5).toBeUndefined()
  });

  it('exclude methods in cache', async () => {

    const repository = 'AnyRepository2'
    const anyMethod = 'anyMethod'
    const anyMethod2 = 'anyMethod2'
    const anyMethod3 = 'anyMethod3'
    const anyValueParam = 'value1'
    

    CacheResolver.getInstance().addRepository(repository, {
        excludesMethods: [
            'anyMethod2'
        ]
    })

    await CacheResolver.getInstance().cacheResult(repository, anyMethod, 10, anyValueParam)
    await CacheResolver.getInstance().cacheResult(repository, anyMethod2, 20, anyValueParam)
    await CacheResolver.getInstance().cacheResult(repository, anyMethod3, 30, anyValueParam)

    const result = await CacheResolver.getInstance().getCacheResult(repository, anyMethod, anyValueParam)
    const result2 = await CacheResolver.getInstance().getCacheResult(repository, anyMethod2, anyValueParam)
    const result3 = await CacheResolver.getInstance().getCacheResult(repository, anyMethod3, anyValueParam)

    expect(result).toBe(10)
    expect(result2).toBeUndefined()
    expect(result3).toBe(30)
  });

  it('include only methods in cache', async () => {

    const repository = 'AnyRepository3'
    const anyMethod = 'anyMethod'
    const anyMethod2 = 'anyMethod2'
    const anyMethod3 = 'anyMethod3'
    const anyValueParam = 'value1'
    

    CacheResolver.getInstance().addRepository(repository, {
        includeOnlyMethods: [
            'anyMethod2'
        ]
    })

    await CacheResolver.getInstance().cacheResult(repository, anyMethod, 10, anyValueParam)
    await CacheResolver.getInstance().cacheResult(repository, anyMethod2, 20, anyValueParam)
    await CacheResolver.getInstance().cacheResult(repository, anyMethod3, 30, anyValueParam)

    const result = await CacheResolver.getInstance().getCacheResult(repository, anyMethod, anyValueParam)
    const result2 = await CacheResolver.getInstance().getCacheResult(repository, anyMethod2, anyValueParam)
    const result3 = await CacheResolver.getInstance().getCacheResult(repository, anyMethod3, anyValueParam)

    expect(result).toBeUndefined()
    expect(result2).toBe(20)
    expect(result3).toBeUndefined()
  });

});