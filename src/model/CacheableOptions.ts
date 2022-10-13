import { CacheProviders } from "./CacheProviders"

export class CacheableOptions {

    cacheOnlyContainResults?: boolean = true

    /**
     *  (default: CacheProviders.LOCAL)
     */
    cacheProvider?: string = CacheProviders.LOCAL

    /**
     *  (default: 0) the standard TTL for cache element cache element. 0 = unlimited
     */
    cacheExpiresInSeconds?: number = 0

    excludesMethods?: Array<string> = new Array

    includeOnlyMethods?: Array<string> = new Array
}