import { Firestore } from "@google-cloud/firestore";
import { ValidatorDataHandle } from "../../exception/handle/ValidatorDataHandle";
import { RepositoryBusinessException } from "../../exception/RepositoryBusinessException";
export class CreateFunction {

    createFunction(methodSignature: string): Function | null {
        
        const func = (this as any)[methodSignature]

        if(func) {
            return func
        }

        return null
    }

    async create(item: any): Promise<any> {

        let modelName = ''

        const db: Firestore = (global as any).instances.globalDbFile.FirestoreInstance.getInstance()
        const { newDate } = (global as any).instances.dateRef
        const uuid = (global as any).instances.uuid

        const collection = db.collection('<COLLECTION_RAPLACE>')

        const validatorDataHandle: ValidatorDataHandle = (global as any).instances.validatorDataHandle

        await validatorDataHandle.validateModel(modelName, item)

        if(!item.id) {
            item.id = uuid();
        }

        item.createAt = newDate()
        item.createTimestampAt = new Date(item.createAt).getTime()

        item.updateAt = newDate()
        item.updateTimestampAt = new Date(item.updateAt).getTime()

        item.lastServiceModify = (global as any).instances.Environment.getProperty('service') || 'PROJECT_UNDEFINED'
        
        await collection.doc(item.id).set(JSON.parse(JSON.stringify(item)))

        return item
    }

    async update(item: any): Promise<any> {

        let modelName = ''

        const db: Firestore = (global as any).instances.globalDbFile.FirestoreInstance.getInstance()
        const { newDate } = (global as any).instances.dateRef

        const collection = db.collection('<COLLECTION_RAPLACE>')

        const validatorDataHandle: ValidatorDataHandle = (global as any).instances.validatorDataHandle

        await validatorDataHandle.validateModel(modelName, item)

        if(!item.id) {
            throw new RepositoryBusinessException(`Id is required`, [])
        }

        item.updateAt = newDate()
        item.updateTimestampAt = new Date(item.updateAt).getTime()

        item.lastServiceModify = (global as any).instances.Environment.getProperty('service') || 'PROJECT_UNDEFINED'

        await collection.doc(item.id).update(JSON.parse(JSON.stringify(item)))

        return item
    }

    async delete(id: string): Promise<string> {

        if(!id) {
            throw new RepositoryBusinessException(`Id is required`, [])
        }

        const db: Firestore = (global as any).instances.globalDbFile.FirestoreInstance.getInstance()

        const collection = db.collection('<COLLECTION_RAPLACE>')

        await collection.doc(id).delete()

        return id
    }

    async findAll(): Promise<any[]> {

        const db: Firestore = (global as any).instances.globalDbFile.FirestoreInstance.getInstance()

        const collection = db.collection('<COLLECTION_RAPLACE>')

        const snapshot = await collection.get()

        let items: Array<any> = new Array

        snapshot.forEach(doc => {
            const data = doc.data()
            items.push({ ...data })
        })

        return items
    }

    async findById(id: string): Promise<any> {

        const db: Firestore = (global as any).instances.globalDbFile.FirestoreInstance.getInstance()

        const collection = db.collection('<COLLECTION_RAPLACE>')

        const response = await collection.doc(id).get()

        return response.data()
    }
}