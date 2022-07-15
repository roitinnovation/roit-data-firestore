import { Firestore } from "@google-cloud/firestore";
import { FirestoreInstance } from '../config/FirestoreInstance';
import { QueryPredicateFunctionTransform } from './QueryPredicateFunctionTransform';
import { RepositoryOptions } from '../model/RepositoryOptions';
import { MQuery, MQuerySimple, Config } from '../model/MQuery';

export class ManualQueryHelper {

    static async executeQueryManual(className: string, config: Config): Promise<Array<any>> {

        const repositoryOptions: RepositoryOptions | undefined = QueryPredicateFunctionTransform.classConfig.get(className)

        if (repositoryOptions) {

            const firestoreInstance: Firestore = FirestoreInstance.getInstance()

            const collection = firestoreInstance.collection(repositoryOptions.collection)

            let queryList: Array<MQuery>

            let queryExecute: any

            if (config.query) {
                if (config.query.some(que => Object.keys(que).length == 1)) {
                    queryList = this.convertToMQuery(config.query as Array<MQuerySimple>)
                } else {
                    queryList = config.query as Array<MQuery>
                }

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

                return this.getData(snapshot)
            }
        }

        return []
    }

    private static convertToMQuery(query: Array<MQuerySimple>): Array<MQuery> {
        return query.map(query => {
            let mQueryBuilder: MQuery = new MQuery
            Object.keys(query).forEach(itmKey => {
                mQueryBuilder.field = itmKey
                mQueryBuilder.operator = '=='
                mQueryBuilder.value = query[itmKey]
            })
            return mQueryBuilder
        })
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