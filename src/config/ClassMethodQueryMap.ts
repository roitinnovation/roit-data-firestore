import { QueryOptions } from '../decorators/Query';

export class ClassMethodQueryMap {

    private static instance: ClassMethodQueryMap = new ClassMethodQueryMap

    private collectionMap: Map<string, Array<string>> = new Map

    private queryConfig: Map<string, QueryOptions> = new Map

    constructor() {

    }

    register(className: string, methodSignature: string, options?: QueryOptions) {

        let list = this.collectionMap.get(className)

        if (!list) {
            list = new Array
        }

        list.push(methodSignature)

        this.collectionMap.set(className, list)

        if (options) {
            this.queryConfig.set(`${className}:${methodSignature}`, options)
        }
    }

    get(className: string): Array<string> | undefined {
        return this.collectionMap.get(className)
    }

    getMethodConfig(className: string, methodSignature: string): QueryOptions | undefined {
        return this.queryConfig.get(`${className}:${methodSignature}`)
    }

    static getInstance() {
        return this.instance
    }
}