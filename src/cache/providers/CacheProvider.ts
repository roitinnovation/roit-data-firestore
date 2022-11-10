
export interface CacheProvider {
    getCacheResult(key: string): Promise<any | null | any[]>
    getKeys(query: string): Promise<string[]>
    saveCacheResult(key: string, valueToCache: any, ttl: number | undefined): Promise<void>
    delete(key: string): Promise<void>
}