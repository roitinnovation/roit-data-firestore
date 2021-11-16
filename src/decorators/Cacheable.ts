import { CacheResolver } from "../cache/CacheResolver"
import { CacheableOptions } from "../model/CacheableOptions"

export function Cacheable(options?: CacheableOptions) {
    return function (constructor: Function) {

        const className = constructor.prototype.constructor.name

        CacheResolver.getInstance().addRepository(className, options)
    }
}