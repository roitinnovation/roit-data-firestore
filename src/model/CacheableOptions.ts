
export class CacheableOptions {

    cacheOnlyContainResults?: boolean = true

    cacheProvider?: string

    excludesMethods?: Array<string> = new Array

    includeOnlyMethods?: Array<string> = new Array
}