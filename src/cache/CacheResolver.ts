import { Environment } from "roit-environment"
import { CacheableOptions } from "../model/CacheableOptions"


export class CacheResolver {

    private static instance: CacheResolver = new CacheResolver

    private repositorys: Map<string, CacheableOptions> = new Map

    private localCacheMap: Map<string, any> = new Map

    private constructor() {

    }

    static getInstance(): CacheResolver {
        return this.instance
    }

    addRepository(repository: string, option?: CacheableOptions) {
        this.repositorys.set(repository, option || {
            cacheOnlyContainResults: true,
            cacheProvider: 'Local',
            excludesMethods: [],
            includeOnlyMethods: []
        })
    }

    getCacheResult(repositoryClassName: string, methodSignature: string, ...paramValue: any[]): any | undefined {
        const result = this.localCacheMap.get(this.buildKey(repositoryClassName, methodSignature, paramValue))
        if(result) {
            console.debug('[DEBUG] Caching >', `Return value in cache from key: ${this.buildKey(repositoryClassName, methodSignature, paramValue)}`)
        }
        return result
    }

    cacheResult(repositoryClassName: string, methodSignature: string, valueToCache: any, ...paramValue: any[]): boolean {

        const option: CacheableOptions | undefined = this.repositorys.get(repositoryClassName)

        if(option) {

            const excludesMethod = Array.isArray(option?.excludesMethods) && option?.excludesMethods?.find(me => me == methodSignature)
            const notIncludeOnlyMethod = Array.isArray(option?.includeOnlyMethods) && option?.includeOnlyMethods?.length > 0 && option?.includeOnlyMethods?.find(me => me == methodSignature) == undefined
            const notContainResult = option?.cacheOnlyContainResults ? ((Array.isArray(valueToCache) && valueToCache.length == 0) || valueToCache == null && valueToCache == undefined) : false

            if(excludesMethod || notIncludeOnlyMethod || notContainResult) {
                return false
            }

            this.localCacheMap.set(this.buildKey(repositoryClassName, methodSignature, paramValue), valueToCache)

            if(Boolean(Environment.getProperty('firestore.debug'))) {
                console.debug('[DEBUG] Caching >', `Storage cache from key: ${this.buildKey(repositoryClassName, methodSignature, paramValue)}`)
            }

            return true
        }

        return false
    }

    private buildKey(repositoryClassName: string, methodSignature: string, ...paramValue: any[]) {
        return `${repositoryClassName}:${methodSignature}:${paramValue.join(',')}`
    }
}