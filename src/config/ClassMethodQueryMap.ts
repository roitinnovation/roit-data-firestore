
export class ClassMethodQueryMap {

    private static instance: ClassMethodQueryMap = new ClassMethodQueryMap

    private collectionMap: Map<string, Array<string>> = new Map

    constructor() {

    }

    register(className: string, methodSignature: string) {

        let list = this.collectionMap.get(className)

        if(!list) {
            list = new Array
        }

        list.push(methodSignature)

        this.collectionMap.set(className, list)
    }

    get(className: string): Array<string> | undefined {
        return this.collectionMap.get(className)
    }

    static getInstance() {
        return this.instance
    }
}