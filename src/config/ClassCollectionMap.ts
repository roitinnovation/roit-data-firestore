
export class ClassCollectionMap {

    private static instance: ClassCollectionMap = new ClassCollectionMap

    private classMap: Map<string, string> = new Map

    private constructor() {

    }

    register(className: string, collection: string) {
        this.classMap.set(className, collection)
    }

    static getInstance() {
        return this.instance
    }
}