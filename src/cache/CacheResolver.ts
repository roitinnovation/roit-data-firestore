import { CacheableOptions } from "../model/CacheableOptions"
import { CacheProvider, InMemoryCacheProvider } from "./providers"
import { RedisCacheProvider } from "./providers/RedisCacheProvider"
import { CacheProviders } from "../model/CacheProviders"
import { currentEnv } from "../util/CurrentEnv"
import { isDebug } from "../util/IsDebug"
import { QueryPredicateFunctionTransform } from "../query/QueryPredicateFunctionTransform"
import { RedisCacheArchiveProvider } from "./providers/RedisCacheArchiveProvider"
import { Environment } from "roit-environment"

export class CacheResolver {

    private static instance: CacheResolver = new CacheResolver

    private repositorys: Map<string, CacheableOptions> = new Map

    private providersImplMap: Map<string, any> = new Map

    private cacheProvider: CacheProvider

    private constructor() {
        this.providersImplMap.set(CacheProviders.LOCAL, InMemoryCacheProvider)
        this.providersImplMap.set(CacheProviders.REDIS, RedisCacheProvider)
        this.providersImplMap.set(CacheProviders.REDIS_ARCHIVE, RedisCacheArchiveProvider)
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
        return `${currentEnv}:${repositoryClassName}:${methodSignature}:${paramValue.join(',')}`
    }

    public buildRepositoryKey(repositoryClassName: string) {
        return `${currentEnv}:${repositoryClassName}`
    }

    async getCacheResult(repositoryClassName: string, methodSignature: string, ...paramValue: any[]): Promise<any | null | any[]> {
        if (!this.repositorys.get(repositoryClassName)) {
            return null
        }

        const key = this.buildKey(repositoryClassName, methodSignature, paramValue)
        return this.cacheProvider.getCacheResult(key)
    }

    async revokeCacheFromRepository(repositoryClassName: string) {
        const key = this.buildRepositoryKey(repositoryClassName)

        if (!this.repositorys.get(repositoryClassName)) {
            return
        }

        const keys = await this.cacheProvider.getKeys(`${key}`)
        if (keys && Array.isArray(keys)) {
            for (const key of keys) {
                if (isDebug) {
                    console.debug('[DEBUG] Caching >', `Removing key: ${key}`)
                }
                await this.cacheProvider.delete(key)
            }
        }
        await this.cacheProvider.delete(key)

        // REVOGAR CACHE DO ARCHIVE PARA A MESMA COLLECTION
        await this.revokeArchiveCacheForRepository(repositoryClassName)
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

            return true
        }

        return false
    }

    async revokeArchiveCache(collectionName?: string, docId?: string): Promise<void> {
        const repositoryKey = this.buildRepositoryKey('ArchiveService')
        
        if (!this.repositorys.get('ArchiveService')) {
            return
        }
    
        const keys = await this.cacheProvider.getKeys(`${repositoryKey}`)
        if (!keys || !Array.isArray(keys)) {
            return
        }
    
        for (const key of keys) {
            let shouldDelete = false
            
            if (collectionName && docId) {
                // Limpar cache de documento específico
                const cacheKey = `archived_${collectionName}_${docId}`
                shouldDelete = key.includes(`getArchivedDocument:${cacheKey}`)
            } else if (collectionName) {
                // Limpar cache de collection específica
                shouldDelete = key.includes(`getArchivedDocument:archived_${collectionName}`)
            } else {
                // Limpar todo o cache de arquivamento
                shouldDelete = key.includes('getArchivedDocument')
            }
    
            if (shouldDelete) {
                if (Boolean(Environment.getProperty('firestore.debug'))) {
                    console.debug('[DEBUG] Archive Cache >', `Removing key: ${key}`)
                }
                await this.cacheProvider.delete(key)
            }
        }
    }

    private async revokeArchiveCacheForRepository(repositoryClassName: string): Promise<void> {
        // Verificar se ArchiveService está registrado
        if (!this.repositorys.get('ArchiveService')) {
            return
        }
    
        // Obter a collection do repositório que está sendo revogado
        const repositoryOptions = QueryPredicateFunctionTransform.classConfig.get(repositoryClassName)
        if (!repositoryOptions || !repositoryOptions.collection) {
            return
        }
    
        const collectionName = repositoryOptions.collection
        
        // Revogar cache do archive para essa collection
        const archiveKeys = await this.cacheProvider.getKeys(`${Environment.currentEnv()}:ArchiveService`)
        if (archiveKeys && Array.isArray(archiveKeys)) {
            for (const key of archiveKeys) {
                if (key.includes(`getArchivedDocument:archived_${collectionName}`)) {
                    if (Boolean(Environment.getProperty('firestore.debug'))) {
                        console.debug('[DEBUG] Archive Cache >', `Removing archive key: ${key}`)
                    }
                    await this.cacheProvider.delete(key)
                }
            }
        }
    }
}