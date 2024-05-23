import { Firestore } from "@google-cloud/firestore";
import { CacheResolver } from "../../cache/CacheResolver";
import { RepositoryBusinessException } from "../../exception/RepositoryBusinessException";
import { ValidatorDataHandle } from "../../exception/handle/ValidatorDataHandle";
import { FirestoreReadAuditResolver } from "../../firestore-read-audit/FirestoreReadAuditResolver";
import { MQuery, MQuerySimple } from "../../model";
import { Aggregate } from "../../model/Aggregate";
import { FindDataConfig } from "../../model/FindDataConfig";
import { EnvironmentUtil } from "../../util/EnvironmentUtil";
import { QueryCreatorConfig } from "../QueryCreatorConfig";
export class CreateFunction {

    createFunction(methodSignature: string): Function | null {

        const func = (this as any)[methodSignature]

        if (func) {
            return func
        }

        return null
    }

    private async revokeCache() { }

    async create(items: any | Array<any>): Promise<Array<any>> {

        let modelName = ''
        let validatorOptions
        let ttlExpirationIn
        let ttlUnit

        if (!Array.isArray(items)) {
            items = [items]
        }

        if (items.length > 500) {
            throw new RepositoryBusinessException(`To perform the create, the maximum number of elements is 500, size current: ${items.length}`, [])
        }

        const db: Firestore = (global as any).instances.globalDbFile.FirestoreInstance.getInstance()
        const { newDate } = (global as any).instances.dateRef
        const uuid = (global as any).instances.uuid
        const environmentUtil: EnvironmentUtil = (global as any).instances.environmentUtil
        const getTtlTimestamp = (global as any).instances.getTtlTimestamp

        const collection = db.collection('<COLLECTION_REPLACE>')

        const validatorDataHandle: ValidatorDataHandle = (global as any).instances.validatorDataHandle

        const batch = db.batch()

        for (const item of items) {
            await validatorDataHandle.validateModel(modelName, item, validatorOptions)

            if (!item.id) {
                item.id = uuid();
            }

            if (!item.createAt) {
                item.createAt = newDate()
                item.createTimestampAt = new Date(item.createAt).getTime()
            }

            item.updateAt = newDate()
            item.updateTimestampAt = new Date(item.updateAt).getTime()

            item.lastServiceModify = (global as any).instances.Environment.getProperty('service') || 'PROJECT_UNDEFINED'

            const docRef = collection.doc(item.id)

            batch.set(docRef, JSON.parse(JSON.stringify(item)))

            if(ttlExpirationIn && ttlUnit) {
                const ttl = getTtlTimestamp(ttlExpirationIn, ttlUnit);
                
                batch.set(docRef, {
                    ttlExpirationAt: ttl,
                }, { merge: true});
            }
        }

        if (!environmentUtil.areWeTesting()) {
            await batch.commit()
            await this.revokeCache()
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
            if (!environmentUtil.areWeTesting()) {
                await document.set({
                    lastServiceModify,
                    updateAt,
                    updateTimestampAt,
                    ...item
                }, { merge: true });

                await this.revokeCache()
            } else {
                console.log('It was decreed that it is being executed try, no operation or effective transaction will be performed')
            }
        } catch (e) {
            console.error(e?.details)
        }
    }

    async update(items: any | Array<any>): Promise<any> {

        let modelName = ''
        let validatorOptions
        let ttlExpirationIn
        let ttlUnit
        let ttlUpdate

        if (!Array.isArray(items)) {
            items = [items]
        }

        if (items.length > 500) {
            throw new RepositoryBusinessException(`To perform the create, the maximum number of elements is 500, size current: ${items.length}`, [])
        }

        const db: Firestore = (global as any).instances.globalDbFile.FirestoreInstance.getInstance()
        const { newDate } = (global as any).instances.dateRef
        const environmentUtil: EnvironmentUtil = (global as any).instances.environmentUtil
        const getTtlTimestamp = (global as any).instances.getTtlTimestamp

        const collection = db.collection('<COLLECTION_REPLACE>')

        const validatorDataHandle: ValidatorDataHandle = (global as any).instances.validatorDataHandle

        const batch = db.batch()

        for (const item of items) {

            await validatorDataHandle.validateModel(modelName, item, validatorOptions)

            if (!item.id) {
                throw new RepositoryBusinessException(`Id is required`, [])
            }

            item.updateAt = newDate()
            item.updateTimestampAt = new Date(item.updateAt).getTime()

            item.lastServiceModify = (global as any).instances.Environment.getProperty('service') || 'PROJECT_UNDEFINED'

            const docRef = collection.doc(item.id)

            batch.set(docRef, JSON.parse(JSON.stringify(item)), { merge: true })

            if(ttlExpirationIn && ttlUnit && ttlUpdate) {
                const ttl = getTtlTimestamp(ttlExpirationIn, ttlUnit);
                
                batch.set(docRef, {
                    ttlExpirationAt: ttl,
                }, { merge: true});
            }
        }

        if (!environmentUtil.areWeTesting()) {
            await batch.commit()
            await this.revokeCache()
        } else {
            console.log('It was decreed that it is being executed try, no operation or effective transaction will be performed')
        }

        return items
    }

    async createOrUpdate(items: any | Array<any>): Promise<Array<any>> {

        let modelName = ''
        let validatorOptions
        let ttlExpirationIn
        let ttlUnit

        if (!Array.isArray(items)) {
            items = [items]
        }

        if (items.length > 500) {
            throw new RepositoryBusinessException(`To perform the create, the maximum number of elements is 500, size current: ${items.length}`, [])
        }

        const db: Firestore = (global as any).instances.globalDbFile.FirestoreInstance.getInstance()
        const { newDate } = (global as any).instances.dateRef
        const uuid = (global as any).instances.uuid
        const environmentUtil: EnvironmentUtil = (global as any).instances.environmentUtil
        const getTtlTimestamp = (global as any).instances.getTtlTimestamp

        const collection = db.collection('<COLLECTION_REPLACE>')

        const validatorDataHandle: ValidatorDataHandle = (global as any).instances.validatorDataHandle

        const batch = db.batch()

        for (const item of items) {
            await validatorDataHandle.validateModel(modelName, item, validatorOptions)

            if (!item.id) {
                item.id = uuid();
            }

            if (!item.createAt) {
                item.createAt = newDate()
                item.createTimestampAt = new Date(item.createAt).getTime()
            }

            item.updateAt = newDate()
            item.updateTimestampAt = new Date(item.updateAt).getTime()

            item.lastServiceModify = (global as any).instances.Environment.getProperty('service') || 'PROJECT_UNDEFINED'

            const docRef = collection.doc(item.id)

            batch.set(docRef, JSON.parse(JSON.stringify(item)), { merge: true })

            if(ttlExpirationIn && ttlUnit) {
                const ttl = getTtlTimestamp(ttlExpirationIn, ttlUnit);
                
                batch.set(docRef, {
                    ttlExpirationAt: ttl,
                }, { merge: true});
            }
        }

        if (!environmentUtil.areWeTesting()) {
            await batch.commit()
            await this.revokeCache()
        } else {
            console.log('It was decreed that it is being executed try, no operation or effective transaction will be performed')
        }

        return items
    }

    async delete(ids: string | Array<string>): Promise<Array<string>> {

        if (!ids) {
            throw new RepositoryBusinessException(`Id is required`, [])
        }

        if (!Array.isArray(ids)) {
            ids = [ids]
        }

        if (ids.length > 500) {
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

        if (!environmentUtil.areWeTesting()) {
            await batch.commit()
            await this.revokeCache()
        } else {
            console.log('It was decreed that it is being executed try, no operation or effective transaction will be performed')
        }

        return ids
    }

    async findAll(paging?: FindDataConfig): Promise<any[]> {

        let repositoryClassName = ''
        let methodSignature = ''

        const db: Firestore = (global as any).instances.globalDbFile.FirestoreInstance.getInstance()
        const cacheResolver: CacheResolver = (global as any).instances.cacheResolver

        const result = await cacheResolver.getCacheResult(repositoryClassName, methodSignature, 'Any')

        if (result) {
            return result as unknown as any[]
        }

        const queryCreatorConfig: QueryCreatorConfig = (global as any).instances.queryCreatorConfig

        const collection = db.collection('<COLLECTION_REPLACE>')

        const environmentUtil: EnvironmentUtil = (global as any).instances.environmentUtil
        if (environmentUtil.areWeTesting()) {
            console.log('It was decreed that it is being executed try, no operation or effective transaction will be performed')
            return []
        }

        let { documentRef } = await queryCreatorConfig.buildPaging(collection, paging, { showCount: false })
        const snapshot = await documentRef.get()

        let items: Array<any> = new Array

        snapshot.forEach(doc => {
            const data = doc.data()
            items.push({ ...data })
        })

        await cacheResolver.cacheResult(repositoryClassName, methodSignature, items, 'Any')

        const firestoreReadAuditResolver: FirestoreReadAuditResolver = (global as any).instances.firestoreReadAuditResolver

        await firestoreReadAuditResolver.persistFirestoreRead({
            collection: '<COLLECTION_REPLACE>',
            repositoryClassName,
            functionSignature: methodSignature,
            queryResult: items
        })

        return items
    }

    async findById(id: string): Promise<any> {

        let repositoryClassName = ''
        let methodSignature = ''

        const db: Firestore = (global as any).instances.globalDbFile.FirestoreInstance.getInstance()
        const cacheResolver: CacheResolver = (global as any).instances.cacheResolver

        const result = await cacheResolver.getCacheResult(repositoryClassName, methodSignature, id)

        if (result) {
            return result
        }

        const collection = db.collection('<COLLECTION_REPLACE>')

        const environmentUtil: EnvironmentUtil = (global as any).instances.environmentUtil
        if (environmentUtil.areWeTesting()) {
            console.log('It was decreed that it is being executed try, no operation or effective transaction will be performed')
            return undefined
        }

        const response = await collection.doc(id).get()

        const item = response.data()

        await cacheResolver.cacheResult(repositoryClassName, methodSignature, item, id)

        const firestoreReadAuditResolver: FirestoreReadAuditResolver = (global as any).instances.firestoreReadAuditResolver

        await firestoreReadAuditResolver.persistFirestoreRead({
            collection: '<COLLECTION_REPLACE>',
            repositoryClassName,
            functionSignature: methodSignature,
            params: id,
            queryResult: item
        })

        return item
    }

    async incrementField(id: string, field: string, increment?: number): Promise<void> {

        const db: Firestore = (global as any).instances.globalDbFile.FirestoreInstance.getInstance()
        const environmentUtil: EnvironmentUtil = (global as any).instances.environmentUtil
        const fieldValueIncrement = (global as any).instances.fieldValueIncrement

        const document = db.collection('<COLLECTION_REPLACE>').doc(id)

        try {
            if (!environmentUtil.areWeTesting()) {

                let payload: any = {}
                payload[field] = fieldValueIncrement(increment || 1)

                await document.set(payload, { merge: true })

                await this.revokeCache()
            } else {
                console.log('It was decreed that it is being executed try, no operation or effective transaction will be performed')
            }
        } catch (e) {
            console.error(e?.details)
        }
    }

    async count(config: { query?: Array<MQuery | MQuerySimple> }): Promise<number> {

        const db: Firestore = (global as any).instances.globalDbFile.FirestoreInstance.getInstance()
        const environmentUtil: EnvironmentUtil = (global as any).instances.environmentUtil
        const convertToMQuery = (global as any).instances.convertToMQuery

        if (environmentUtil.areWeTesting()) {
            console.log('It was decreed that it is being executed try, no operation or effective transaction will be performed')
            return 0
        }

        const collection = db.collection('<COLLECTION_REPLACE>')

        let queryList: Array<MQuery>
        let queryExecute: any

        if(config?.query && config.query.length > 0) {
            queryList = config.query.map(query => {
                if (Object.keys(query).length === 1) {
                    return convertToMQuery(query)
                }
                return query;
            }) as Array<MQuery>
    
            const queryInit = queryList[0]
    
            queryExecute = collection.where(queryInit.field, queryInit.operator, queryInit.value)
    
            queryList.shift()
    
            queryList.forEach(que => {
                queryExecute = queryExecute!.where(que.field, que.operator, que.value)
            })
        } else {
            queryExecute = collection
        }
      

        const snapshot = await queryExecute.count().get()

        return snapshot.data().count;
    }

    async sum(config: { attributeSum: string, query?: Array<MQuery | MQuerySimple> }): Promise<number> {

        const db: Firestore = (global as any).instances.globalDbFile.FirestoreInstance.getInstance()
        const environmentUtil: EnvironmentUtil = (global as any).instances.environmentUtil
        const convertToMQuery = (global as any).instances.convertToMQuery
        const aggregateSum = (global as any).instances.aggregateSum

        if (environmentUtil.areWeTesting()) {
            console.log('It was decreed that it is being executed try, no operation or effective transaction will be performed')
            return 0
        }

        const collection = db.collection('<COLLECTION_REPLACE>')

        let queryList: Array<MQuery>
        let queryExecute: any

        if(config?.query && config.query.length > 0) {
            queryList = config.query.map(query => {
                if (Object.keys(query).length === 1) {
                    return convertToMQuery(query)
                }
                return query;
            }) as Array<MQuery>
    
            const queryInit = queryList[0]
    
            queryExecute = collection.where(queryInit.field, queryInit.operator, queryInit.value)
    
            queryList.shift()
    
            queryList.forEach(que => {
                queryExecute = queryExecute!.where(que.field, que.operator, que.value)
            })
        } else {
            queryExecute = collection
        }

        const sumAggregateQuery = queryExecute.aggregate({
            sum: aggregateSum(config.attributeSum),
        });

        const snapshot = await sumAggregateQuery.get()

        return snapshot.data().sum;
    }

    async average(config: { attributeAvg: string, query?: Array<MQuery | MQuerySimple> }): Promise<number> {

        const db: Firestore = (global as any).instances.globalDbFile.FirestoreInstance.getInstance()
        const environmentUtil: EnvironmentUtil = (global as any).instances.environmentUtil
        const convertToMQuery = (global as any).instances.convertToMQuery
        const aggregateAverage = (global as any).instances.aggregateAverage

        if (environmentUtil.areWeTesting()) {
            console.log('It was decreed that it is being executed try, no operation or effective transaction will be performed')
            return 0
        }

        const collection = db.collection('<COLLECTION_REPLACE>')

        let queryList: Array<MQuery>
        let queryExecute: any

        if(config?.query && config.query.length > 0) {
            queryList = config.query.map(query => {
                if (Object.keys(query).length === 1) {
                    return convertToMQuery(query)
                }
                return query;
            }) as Array<MQuery>
    
            const queryInit = queryList[0]
    
            queryExecute = collection.where(queryInit.field, queryInit.operator, queryInit.value)
    
            queryList.shift()
    
            queryList.forEach(que => {
                queryExecute = queryExecute!.where(que.field, que.operator, que.value)
            })
        } else {
            queryExecute = collection
        }

        const averageAggregateQuery = queryExecute.aggregate({
            average: aggregateAverage(config.attributeAvg),
        });

        const snapshot = await averageAggregateQuery.get()

        return snapshot.data().average;
    }

    async aggregation(config: { query?: Array<MQuery | MQuerySimple>, aggregations: Array<Aggregate> }): Promise<{ [k: string]: string | number }> {

        const db: Firestore = (global as any).instances.globalDbFile.FirestoreInstance.getInstance()
        const environmentUtil: EnvironmentUtil = (global as any).instances.environmentUtil
        const convertToMQuery = (global as any).instances.convertToMQuery
        const aggregateAverage = (global as any).instances.aggregateAverage
        const aggregateSum = (global as any).instances.aggregateSum
        const aggregateCount = (global as any).instances.aggregateCount

        if (environmentUtil.areWeTesting()) {
            console.log('It was decreed that it is being executed try, no operation or effective transaction will be performed')
            return {}
        }

        const collection = db.collection('<COLLECTION_REPLACE>')

        let queryList: Array<MQuery>
        let queryExecute: any

        if(config?.query && config.query.length > 0) {
            queryList = config.query.map(query => {
                if (Object.keys(query).length === 1) {
                    return convertToMQuery(query)
                }
                return query;
            }) as Array<MQuery>
    
            const queryInit = queryList[0]
    
            queryExecute = collection.where(queryInit.field, queryInit.operator, queryInit.value)
    
            queryList.shift()
    
            queryList.forEach(que => {
                queryExecute = queryExecute!.where(que.field, que.operator, que.value)
            })
        } else {
            queryExecute = collection
        }

        let aggregateObject: any = {}

        config.aggregations.forEach(item => {

            if(item.type == 'average') {
                aggregateObject[item.field] = aggregateAverage(item.field)
            }

            if(item.type == 'sum') {
                aggregateObject[item.field] = aggregateSum(item.field)
            }

            if(item.type == 'count') {
                aggregateObject[item.field] = aggregateCount()
            }
        })

        const averageAggregateQuery = queryExecute.aggregate(aggregateObject);

        const snapshot = await averageAggregateQuery.get()

        let resultBuilder: any = {}

        config.aggregations.forEach(item => {
            resultBuilder[item.field] = snapshot.data()[item.field]
        })

        return resultBuilder;
    }
}