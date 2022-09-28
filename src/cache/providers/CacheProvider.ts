import { CacheableOptions } from "../../model/CacheableOptions"

export interface CacheProvider {
    getCacheResult(key: string): any | undefined
    saveCacheResult(key: string, option: CacheableOptions | undefined, methodSignature: string, valueToCache: any): boolean
}