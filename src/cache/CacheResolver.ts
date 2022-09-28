import { CacheableOptions } from "../model/CacheableOptions"
import { VillarImplDiscovery, VillarImplResolver } from "villar"
import { CacheProvider, InMemory } from "./providers"
import { Environment } from "roit-environment"

export class CacheResolver {

    private static instance: CacheResolver = new CacheResolver

    private repositorys: Map<string, CacheableOptions> = new Map

    private cacheProvider: CacheProvider

    private constructor() {

    }

    static getInstance(): CacheResolver {
        return this.instance
    }

    addRepository(repository: string, option?: CacheableOptions) {
        const options = option || new CacheableOptions

        VillarImplResolver.register(InMemory)

        this.cacheProvider = VillarImplDiscovery.getInstance().findImpl<CacheProvider>(options.cacheProvider)!

        this.repositorys.set(repository, options)
    }

    private buildKey(repositoryClassName: string, methodSignature: string, ...paramValue: any[]) {
        const service = Environment.getProperty('service')
        return `${service}:${repositoryClassName}:${methodSignature}:${paramValue.join(',')}`
    }

    getCacheResult(repositoryClassName: string, methodSignature: string, ...paramValue: any[]): any | undefined {
        const key = this.buildKey(repositoryClassName, methodSignature, paramValue)
        this.cacheProvider.getCacheResult(key)
    }

    cacheResult(repositoryClassName: string, methodSignature: string, valueToCache: any, ...paramValue: any[]): boolean {
        const option: CacheableOptions | undefined = this.repositorys.get(repositoryClassName)

        const key = this.buildKey(repositoryClassName, methodSignature, paramValue)

        return this.cacheProvider.saveCacheResult(key, option, methodSignature, valueToCache)
    }
}