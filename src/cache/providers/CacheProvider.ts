
export interface CacheProvider {
    getCacheResult(key: string): Promise<string | null>
    saveCacheResult(key: string, valueToCache: any, ttl: number | undefined): Promise<void>
}