import { Firestore } from "@google-cloud/firestore";
import { CacheResolver } from "../../cache/CacheResolver";
import { ValidatorDataHandle } from "../../exception/handle/ValidatorDataHandle";
import { RepositoryBusinessException } from "../../exception/RepositoryBusinessException";
import { Paging } from "../../model/Paging";
import { EnvironmentUtil } from "../../util/EnvironmentUtil";
import { QueryCreatorConfig } from "../QueryCreatorConfig";
export class CreateFunction {

    createFunction(methodSignature: string): Function | null {
        
        const func = (this as any)[methodSignature]

        if(func) {
            return func
        }

        return null
    }

    async create(items: any | Array<any>): Promise<Array<any>> {

        let modelName = ''
        let validatorOptions

        if(!Array.isArray(items)) {
            items = [ items ]
        }

        if(items.length > 500) {
            throw new RepositoryBusinessException(`To perform the create, the maximum number of elements is 500, size current: ${items.length}`, [])
        }

        const db: Firestore = (global as any).instances.globalDbFile.FirestoreInstance.getInstance()
        const { newDate } = (global as any).instances.dateRef
        const uuid = (global as any).instances.uuid
        const environmentUtil: EnvironmentUtil = (global as any).instances.environmentUtil

        const collection = db.collection('<COLLECTION_REPLACE>')

        const validatorDataHandle: ValidatorDataHandle = (global as any).instances.validatorDataHandle

        const batch = db.batch()

        for(const item of items) {
            await validatorDataHandle.validateModel(modelName, item, validatorOptions)

            if(!item.id) {
                item.id = uuid();
            }
    
            item.createAt = newDate()
            item.createTimestampAt = new Date(item.createAt).getTime()
    
            item.updateAt = newDate()
            item.updateTimestampAt = new Date(item.updateAt).getTime()
    
            item.lastServiceModify = (global as any).instances.Environment.getProperty('service') || 'PROJECT_UNDEFINED'
            
            const docRef = collection.doc(item.id)

            batch.set(docRef, JSON.parse(JSON.stringify(item)))
        }

        if(!environmentUtil.areWeTesting()) { 
            await batch.commit()
        } else {
            console.log('It was decreed that it is being executed try, no operation or effective transaction will be performed')
        }

        return items
    }

    async updatePartial(id: Required<string>, item: any): Promise<void> {

        const db: Firestore = (global as any).instances.globalDbFile.FirestoreInstance.getInstance()
        const { newDate } = (global as any).instances.dateRef

        const lastServiceModify = (global as any).instances.Environment.getProperty('service') || 'PROJECT_UNDEFINED'
        const updateAt = newDate()
        const updateTimestampAt = new Date(updateAt).getTime()
        const environmentUtil: EnvironmentUtil = (global as any).instances.environmentUtil

        const document = db.collection('<COLLECTION_REPLACE>').doc(id)

        try {
            if(!environmentUtil.areWeTesting()) { 
                await document.update({ 
                    lastServiceModify,
                    updateAt,
                    updateTimestampAt,
                    ...item
                });

                let repositoryClassName = ''

                const cacheResolver: CacheResolver = (global as any).instances.cacheResolver
    
                const key = cacheResolver.buildRepositoryKey(repositoryClassName)
    
                await cacheResolver.revokeCacheFromRepository(key)                        
            } else {
                console.log('It was decreed that it is being executed try, no operation or effective transaction will be performed')
            }
        } catch(e) {
            console.error(e?.details)
        }
    }

    async update(items: any | Array<any>): Promise<any> {

        let modelName = ''
        let validatorOptions

        if(!Array.isArray(items)) {
            items = [ items ]
        }

        if(items.length > 500) {
            throw new RepositoryBusinessException(`To perform the create, the maximum number of elements is 500, size current: ${items.length}`, [])
        }

        const db: Firestore = (global as any).instances.globalDbFile.FirestoreInstance.getInstance()
        const { newDate } = (global as any).instances.dateRef
        const environmentUtil: EnvironmentUtil = (global as any).instances.environmentUtil

        const collection = db.collection('<COLLECTION_REPLACE>')

        const validatorDataHandle: ValidatorDataHandle = (global as any).instances.validatorDataHandle

        const batch = db.batch()

        for(const item of items) {

            await validatorDataHandle.validateModel(modelName, item, validatorOptions)

            if(!item.id) {
                throw new RepositoryBusinessException(`Id is required`, [])
            }

            item.updateAt = newDate()
            item.updateTimestampAt = new Date(item.updateAt).getTime()

            item.lastServiceModify = (global as any).instances.Environment.getProperty('service') || 'PROJECT_UNDEFINED'

            const docRef = collection.doc(item.id)

            batch.update(docRef, JSON.parse(JSON.stringify(item)))

            let repositoryClassName = ''

            const cacheResolver: CacheResolver = (global as any).instances.cacheResolver

            const key = cacheResolver.buildRepositoryKey(repositoryClassName)

            await cacheResolver.revokeCacheFromRepository(key)            
        }

        if(!environmentUtil.areWeTesting()) { 
            await batch.commit()
        } else {
            console.log('It was decreed that it is being executed try, no operation or effective transaction will be performed')
        }

        return items
    }

    async createOrUpdate(items: any | Array<any>): Promise<Array<any>> {

        let modelName = ''
        let validatorOptions

        if(!Array.isArray(items)) {
            items = [ items ]
        }

        if(items.length > 500) {
            throw new RepositoryBusinessException(`To perform the create, the maximum number of elements is 500, size current: ${items.length}`, [])
        }

        const db: Firestore = (global as any).instances.globalDbFile.FirestoreInstance.getInstance()
        const { newDate } = (global as any).instances.dateRef
        const uuid = (global as any).instances.uuid
        const environmentUtil: EnvironmentUtil = (global as any).instances.environmentUtil

        const collection = db.collection('<COLLECTION_REPLACE>')

        const validatorDataHandle: ValidatorDataHandle = (global as any).instances.validatorDataHandle

        const batch = db.batch()

        for(const item of items) {
            await validatorDataHandle.validateModel(modelName, item, validatorOptions)

            if(!item.id) {
                item.id = uuid();
            }
    
            if(!item.createAt) {
                item.createAt = newDate()
                item.createTimestampAt = new Date(item.createAt).getTime()
            }
    
            item.updateAt = newDate()
            item.updateTimestampAt = new Date(item.updateAt).getTime()
    
            item.lastServiceModify = (global as any).instances.Environment.getProperty('service') || 'PROJECT_UNDEFINED'
            
            const docRef = collection.doc(item.id)

            batch.set(docRef, JSON.parse(JSON.stringify(item)), { merge: true })
        }

        if(!environmentUtil.areWeTesting()) { 
            await batch.commit()
        } else {
            console.log('It was decreed that it is being executed try, no operation or effective transaction will be performed')
        }

        return items
    }

    async delete(ids: string | Array<string>): Promise<Array<string>> {

        if(!ids) {
            throw new RepositoryBusinessException(`Id is required`, [])
        }

        if(!Array.isArray(ids)) {
            ids = [ ids ]
        }

        if(ids.length > 500) {
            throw new RepositoryBusinessException(`To perform the delete, the maximum number of elements is 500, size current: ${ids.length}`, [])
        }

        const db: Firestore = (global as any).instances.globalDbFile.FirestoreInstance.getInstance()
        const environmentUtil: EnvironmentUtil = (global as any).instances.environmentUtil

        const batch = db.batch()

        const collection = db.collection('<COLLECTION_REPLACE>')

        ids.forEach(id => {
            const docRef = collection.doc(id)
            batch.delete(docRef)
        })

        if(!environmentUtil.areWeTesting()) { 
            let repositoryClassName = ''

            const cacheResolver: CacheResolver = (global as any).instances.cacheResolver

            const key = cacheResolver.buildRepositoryKey(repositoryClassName)

            await cacheResolver.revokeCacheFromRepository(key)   
                        
            await batch.commit()
        } else {
            console.log('It was decreed that it is being executed try, no operation or effective transaction will be performed')
        }

        return ids
    }

    async findAll(paging?: Paging): Promise<any[]> {

        let repositoryClassName = ''
        let methodSignature = ''

        const db: Firestore = (global as any).instances.globalDbFile.FirestoreInstance.getInstance()
        const cacheResolver: CacheResolver = (global as any).instances.cacheResolver

        const result = await cacheResolver.getCacheResult(repositoryClassName, methodSignature, 'Any')
        
        if(result) {
            return result as unknown as any[]
        }

        const queryCreatorConfig: QueryCreatorConfig = (global as any).instances.queryCreatorConfig

        const collection = db.collection('<COLLECTION_REPLACE>')

        const environmentUtil: EnvironmentUtil = (global as any).instances.environmentUtil
        if(environmentUtil.areWeTesting()) { 
            console.log('It was decreed that it is being executed try, no operation or effective transaction will be performed')
            return []
        }

        let documentRef = queryCreatorConfig.buildPaging(collection, paging)
        const snapshot = await documentRef.get()

        let items: Array<any> = new Array

        snapshot.forEach(doc => {
            const data = doc.data()
            items.push({ ...data })
        })

        await cacheResolver.cacheResult(repositoryClassName, methodSignature, items, 'Any')

        return items
    }

    async findById(id: string): Promise<any> {

        let repositoryClassName = ''
        let methodSignature = ''

        const db: Firestore = (global as any).instances.globalDbFile.FirestoreInstance.getInstance()
        const cacheResolver: CacheResolver = (global as any).instances.cacheResolver

        const result = await cacheResolver.getCacheResult(repositoryClassName, methodSignature, id)
        
        if(result) {
            return result
        }

        const collection = db.collection('<COLLECTION_REPLACE>')

        const environmentUtil: EnvironmentUtil = (global as any).instances.environmentUtil
        if(environmentUtil.areWeTesting()) { 
            console.log('It was decreed that it is being executed try, no operation or effective transaction will be performed')
            return undefined
        }

        const response = await collection.doc(id).get()

        const item = response.data()

        await cacheResolver.cacheResult(repositoryClassName, methodSignature, item, id)

        return item
    }
}