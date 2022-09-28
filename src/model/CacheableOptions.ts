import { CacheProviders } from "./CacheProviders"

export class CacheableOptions {

    cacheOnlyContainResults?: boolean = true

    cacheProvider: string = CacheProviders.LOCAL

    excludesMethods?: Array<string> = new Array

    includeOnlyMethods?: Array<string> = new Array
}