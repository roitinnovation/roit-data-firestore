import { Environment } from "roit-environment";
import { Implementation } from "villar";
import { CacheProviders } from '../../model/CacheProviders'
import { CacheProvider } from "./CacheProvider";

import * as NodeCache from "node-cache";

@Implementation({
    key: CacheProviders.LOCAL
})
export class InMemoryCacheProvider implements CacheProvider {
    
    private cache: NodeCache = new NodeCache();

    getCacheResult(key: string): Promise<string | null> {
        const result = this.cache.get(key) as string | null

        if (Boolean(Environment.getProperty('firestore.debug'))) {
            if (result) {
                console.debug('[DEBUG] Local Caching >', `Return value in cache from key: ${key}`)
            } else {
                console.log("[DEBUG] Local Caching > ", `Key [${key}] is not found in the cache`)
            }
        }

        return Promise.resolve(result)
    }

    saveCacheResult(key: string, valueToCache: any, ttl: number): Promise<void> {
        this.cache.set(key, valueToCache, ttl || 0)
        return Promise.resolve()
    }
}