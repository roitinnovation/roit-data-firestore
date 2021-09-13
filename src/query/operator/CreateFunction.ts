import { Firestore } from "@google-cloud/firestore"

export class CreateFunction {

    constructor() {
        (global as any).dateRef = require('@roit/roit-date')
    }

    createFunction(methodSignature: string): Function | null {
        
        const func = (this as any)[methodSignature]

        if(func) {
            return func
        }

        return null
    }

    async create(item: any): Promise<any> {

        const db: Firestore = (global as any).globalDbFile.FirestoreInstance.getInstance()
        const { newDate } = (global as any).dateRef

        const collection = db.collection('<COLLECTION_RAPLACE>')

        if(!item.id) {
            item.id = this.generateUniqueId();
        }

        item.createAt = newDate()
        item.createTimestampAt = new Date(item.createAt).getTime()

        item.updateAt = newDate()
        item.updateTimestampAt = new Date(item.updateAt).getTime()

        await collection.doc(item.id).set(JSON.parse(JSON.stringify(item)))

        return item
    }

    async update(item: any): Promise<any> {

        const db: Firestore = (global as any).globalDbFile.FirestoreInstance.getInstance()
        const { newDate } = (global as any).dateRef

        const collection = db.collection('<COLLECTION_RAPLACE>')

        if(!item.id) {
            throw new Error(`Id is required`)
        }

        item.updateAt = newDate()
        item.updateTimestampAt = new Date(item.updateAt).getTime()

        await collection.doc(item.id).update(JSON.parse(JSON.stringify(item)))

        return item
    }

    async delete(id: string): Promise<string> {

        const db: Firestore = (global as any).globalDbFile.FirestoreInstance.getInstance()

        const collection = db.collection('<COLLECTION_RAPLACE>')

        await collection.doc(id).delete()

        return id
    }

    async findAll(): Promise<Array<any>> {

        const db: Firestore = (global as any).globalDbFile.FirestoreInstance.getInstance()

        const collection = db.collection('<COLLECTION_RAPLACE>')

        const snapshot = await collection.get()

        let items: Array<any> = new Array

        snapshot.forEach(doc => {
            const data = doc.data()
            items.push({ ...data })
        })

        console.log('items', items)

        return items
    }

    async findById(id: string): Promise<any> {

        const db: Firestore = (global as any).globalDbFile.FirestoreInstance.getInstance()

        const collection = db.collection('<COLLECTION_RAPLACE>')

        const response = await collection.doc(id).get()

        return response.data()
    }

    private generateUniqueId() {
        return `${new Date().getTime()}.${Math.random().toString(36)}`.toUpperCase()
    }
}