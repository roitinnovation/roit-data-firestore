
export interface CacheProvider {
    getCacheResult(key: string): Promise<any | null | any[]>
    saveCacheResult(key: string, valueToCache: any, ttl: number | undefined): Promise<void>
    delete(key: string): Promise<void>
}