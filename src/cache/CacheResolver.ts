import { CacheableOptions } from "../model/CacheableOptions"
import { CacheProvider, InMemoryCacheProvider } from "./providers"
import { Environment } from "roit-environment"
import { RedisCacheProvider } from "./providers/RedisCacheProvider"
import { CacheProviders } from "../model/CacheProviders"

export class CacheResolver {

    private static instance: CacheResolver = new CacheResolver

    private repositorys: Map<string, CacheableOptions> = new Map

    private providersImplMap: Map<string, any> = new Map

    private cacheProvider: CacheProvider

    private constructor() {
        this.providersImplMap.set(CacheProviders.LOCAL, InMemoryCacheProvider)
        this.providersImplMap.set(CacheProviders.REDIS, RedisCacheProvider)
    }

    static getInstance(): CacheResolver {
        return this.instance
    }

    addRepository(repository: string, option?: CacheableOptions) {
        const options = option || new CacheableOptions
        const implementation = options.cacheProvider || CacheProviders.LOCAL
        const providerImpl = this.providersImplMap.get(implementation)
        this.cacheProvider = new providerImpl()
        this.repositorys.set(repository, options)
    }

    private buildKey(repositoryClassName: string, methodSignature: string, ...paramValue: any[]) {
        const service = Environment.getProperty('service')
        return `${Environment.currentEnv()}:${service}:${repositoryClassName}:${methodSignature}:${paramValue.join(',')}`
    }

    public buildRepositoryKey(repositoryClassName: string) {
        return `${Environment.currentEnv()}:${Environment.getProperty('service')}:${repositoryClassName}`
    }

    async getCacheResult(repositoryClassName: string, methodSignature: string, ...paramValue: any[]): Promise<string | null> {
        const key = this.buildKey(repositoryClassName, methodSignature, paramValue)
        return this.cacheProvider.getCacheResult(key)
    }

    async revokeCacheFromRepository(repository: string) {
        const keys = await this.cacheProvider.getCacheResult(repository)
        if (keys && Array.isArray(keys)) {
            for (const key of keys) {
                if (Boolean(Environment.getProperty('firestore.debug'))) {
                    console.debug('[DEBUG] Caching >', `Removing key: ${key}`)
                }
                await this.cacheProvider.delete(key)
            }
        }
    }

    async cacheResult(repositoryClassName: string, methodSignature: string, valueToCache: any, ...paramValue: any[]): Promise<boolean> {
        const option: CacheableOptions | undefined = this.repositorys.get(repositoryClassName)

        if (option) {
            const key = this.buildKey(repositoryClassName, methodSignature, paramValue)
            const excludesMethod = Array.isArray(option?.excludesMethods) && option?.excludesMethods?.find(me => me == methodSignature)
            const notIncludeOnlyMethod = Array.isArray(option?.includeOnlyMethods) && option?.includeOnlyMethods?.length > 0 && option?.includeOnlyMethods?.find(me => me == methodSignature) == undefined
            const notContainResult = option?.cacheOnlyContainResults ? ((Array.isArray(valueToCache) && valueToCache.length == 0) || !valueToCache) : false

            if (excludesMethod || notIncludeOnlyMethod || notContainResult) {
                return false
            }

            await this.cacheProvider.saveCacheResult(key, valueToCache, option.cacheExpiresInSeconds)

            const repositoryKey = this.buildRepositoryKey(repositoryClassName)

            let cache: any[] = await this.cacheProvider.getCacheResult(repositoryKey)

            if (!cache) {
                cache = []
            }

            if (!cache.find(item => item === key)) {
                cache.push(key)
            }

            const cacheTtl = 0

            await this.cacheProvider.saveCacheResult(repositoryKey, cache, cacheTtl)

            return true
        }

        return false
    }
}