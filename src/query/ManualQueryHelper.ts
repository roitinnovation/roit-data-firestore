import { Firestore } from "@google-cloud/firestore";
import { FirestoreInstance } from '../config/FirestoreInstance';
import { QueryPredicateFunctionTransform } from './QueryPredicateFunctionTransform';
import { RepositoryOptions } from '../model/RepositoryOptions';
import { MQuery, MQuerySimple, Config } from '../model/MQuery';
import { CacheResolver } from "../cache/CacheResolver";
import { FirestoreReadAuditResolver } from "../firestore-read-audit/FirestoreReadAuditResolver";

export class ManualQueryHelper {

    static async executeQueryManual(className: string, config: Config): Promise<Array<any>> {

        const repositoryOptions: RepositoryOptions | undefined = QueryPredicateFunctionTransform.classConfig.get(className)

        const cacheResolver: CacheResolver = (global as any).instances.cacheResolver

        if (repositoryOptions) {

            const firestoreInstance: Firestore = FirestoreInstance.getInstance()

            const collection = firestoreInstance.collection(repositoryOptions.collection)

            let queryList: Array<MQuery>

            let queryExecute: any

            if (config.query) {

                queryList = config.query.map(query => {
                    if (Object.keys(query).length === 1) {
                        return this.convertToMQuery(query as MQuerySimple)
                    }
                    return query;
                }) as Array<MQuery>

                const queryInit = queryList[0]

                queryExecute = collection.where(queryInit.field, queryInit.operator, queryInit.value)

                queryList.shift()

                queryList.forEach(que => {
                    queryExecute = queryExecute.where(que.field, que.operator, que.value)
                })
            }


            if (config && config?.orderBy) {
                if (queryExecute) {
                    queryExecute = queryExecute.orderBy(config.orderBy.field, config.orderBy.direction)
                } else {
                    queryExecute = collection.orderBy(config.orderBy.field, config.orderBy.direction)
                }

            }

            if (queryExecute) {
                const snapshot = await queryExecute.get()

                const result = await cacheResolver.getCacheResult(className, 'any', JSON.stringify(config))

                if (result) {
                    return result
                }

                const data = this.getData(snapshot);
                
                await cacheResolver.cacheResult(className, 'any', data, JSON.stringify(config))

                const firestoreReadAuditResolver: FirestoreReadAuditResolver = (global as any).instances.firestoreReadAuditResolver

                await firestoreReadAuditResolver.persistFirestoreRead({
                    collection: repositoryOptions.collection,
                    repositoryClassName: className,
                    functionSignature: 'manual-query',
                    params: JSON.stringify(config)
                })

                return data
            }
        }

        return []
    }

    private static convertToMQuery(query: MQuerySimple): MQuery {
        let mQueryBuilder: MQuery = new MQuery
        Object.keys(query).forEach(itmKey => {
            mQueryBuilder.field = itmKey
            mQueryBuilder.operator = '=='
            mQueryBuilder.value = query[itmKey]
        })
        return mQueryBuilder
    }

    private static getData(snapshot: any) {

        let items: Array<any> = []

        try {
            snapshot.forEach((doc: any) => {
                let element = { ...doc.data() }
                element.id = doc.id
                items.push(element)
            })

        } catch (err) {
            throw new Error(err.response)
        }

        return items
    }
}