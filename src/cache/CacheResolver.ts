import { CacheableOptions } from "../model/CacheableOptions"
import { VillarImplDiscovery, VillarImplResolver } from "villar"
import { CacheProvider, InMemoryCacheProvider } from "./providers"
import { Environment } from "roit-environment"
import { RedisCacheProvider } from "./providers/RedisCacheProvider"

export class CacheResolver {

    private static instance: CacheResolver = new CacheResolver

    private repositorys: Map<string, CacheableOptions> = new Map

    private cacheProvider: CacheProvider

    private constructor() {
        VillarImplResolver.register(InMemoryCacheProvider, RedisCacheProvider)
    }

    static getInstance(): CacheResolver {
        return this.instance
    }

    addRepository(repository: string, option?: CacheableOptions) {
        const options = option || new CacheableOptions
        this.cacheProvider = VillarImplDiscovery.getInstance().findImpl<CacheProvider>(options.cacheProvider!)!
        this.repositorys.set(repository, options)
    }

    private buildKey(repositoryClassName: string, methodSignature: string, ...paramValue: any[]) {
        const service = Environment.getProperty('service')
        return `${service}:${repositoryClassName}:${methodSignature}:${paramValue.join(',')}`
    }

    async getCacheResult(repositoryClassName: string, methodSignature: string, ...paramValue: any[]): Promise<string | null> {
        const key = this.buildKey(repositoryClassName, methodSignature, paramValue)
        return this.cacheProvider.getCacheResult(key)
    }

    async cacheResult(repositoryClassName: string, methodSignature: string, valueToCache: any, ...paramValue: any[]): Promise<boolean> {
        const option: CacheableOptions | undefined = this.repositorys.get(repositoryClassName)

        if (option) {
            const key = this.buildKey(repositoryClassName, methodSignature, paramValue)
            const excludesMethod = Array.isArray(option?.excludesMethods) && option?.excludesMethods?.find(me => me == methodSignature)
            const notIncludeOnlyMethod = Array.isArray(option?.includeOnlyMethods) && option?.includeOnlyMethods?.length > 0 && option?.includeOnlyMethods?.find(me => me == methodSignature) == undefined
            const notContainResult = option?.cacheOnlyContainResults ? ((Array.isArray(valueToCache) && valueToCache.length == 0) || valueToCache == null && valueToCache == undefined) : false

            if (excludesMethod || notIncludeOnlyMethod || notContainResult) {
                return false
            }

            await this.cacheProvider.saveCacheResult(key, valueToCache, option.cacheExpiresInSeconds)

            if (Boolean(Environment.getProperty('firestore.debug'))) {
                console.debug('[DEBUG] Caching >', `Storage cache from key: ${key}`)
            }

            return true
        }

        return false
    }
}