import { isDebug } from "../../util/IsDebug";
import { CacheProvider } from "./CacheProvider";

import NodeCache from "node-cache";

export class InMemoryCacheProvider implements CacheProvider {
    
    private cache: NodeCache = new NodeCache();

    getCacheResult(key: string): Promise<any | null> {
        const result = this.cache.get(key) as string | null

        if (isDebug) {
            if (result) {
                console.debug('[DEBUG] Memory Caching >', `Return value in cache from key: ${key}`)
            } else {
                console.log("[DEBUG] Memory Caching > ", `Key [${key}] is not found in the cache`)
            }
        }

        return Promise.resolve(result)
    }

    getKeys(query: string): Promise<string[]> {
        try {
            return Promise.resolve(this.cache.keys().filter(key => key.includes(query)))
        } catch (error) {
            console.log(`[DEBUG] Memory Caching > Error when getting KEYS with query: ${query}, error: ${error}`)
        }
        return Promise.resolve([])
    }

    saveCacheResult(key: string, valueToCache: any, ttl: number): Promise<void> {
        this.cache.set(key, valueToCache, ttl || 0)
        if (isDebug) {
            console.debug('[DEBUG] Memory Caching >', `Storage cache from key: ${key}`)
        }
        return Promise.resolve()
    }

    delete(key: string): Promise<void> {
        this.cache.del(key)
        return Promise.resolve()
    }
}