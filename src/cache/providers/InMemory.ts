import { Environment } from "roit-environment";
import { Implementation } from "villar";
import { CacheableOptions } from "../../model/CacheableOptions";
import { CacheProviders } from '../../model/CacheProviders'
import { CacheProvider } from "./CacheProvider";

@Implementation({
    key: CacheProviders.LOCAL
})
export class InMemory implements CacheProvider {

    private localCacheMap: Map<string, any> = new Map

    getCacheResult(key: string) {
        const result = this.localCacheMap.get(key)

        if (Boolean(Environment.getProperty('firestore.debug'))) {
            if (result) {
                console.debug('[DEBUG] Caching >', `Return value in cache from key: ${key}`)
            } else {
                console.log("[DEBUG] Does not have in cache", key)
            }
        }

        return result
    }

    saveCacheResult(key: string, option: CacheableOptions | undefined, methodSignature: string, valueToCache: any): boolean {
        if (option) {
            const excludesMethod = Array.isArray(option?.excludesMethods) && option?.excludesMethods?.find(me => me == methodSignature)
            const notIncludeOnlyMethod = Array.isArray(option?.includeOnlyMethods) && option?.includeOnlyMethods?.length > 0 && option?.includeOnlyMethods?.find(me => me == methodSignature) == undefined
            const notContainResult = option?.cacheOnlyContainResults ? ((Array.isArray(valueToCache) && valueToCache.length == 0) || valueToCache == null && valueToCache == undefined) : false

            if (excludesMethod || notIncludeOnlyMethod || notContainResult) {
                return false
            }

            this.localCacheMap.set(key, valueToCache)

            if (Boolean(Environment.getProperty('firestore.debug'))) {
                console.debug('[DEBUG] Caching >', `Storage cache from key: ${key}`)
            }

            return true
        }

        return false
    }
}