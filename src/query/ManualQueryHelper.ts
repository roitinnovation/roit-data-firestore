import { Firestore } from "@google-cloud/firestore";
import { FirestoreInstance } from '../config/FirestoreInstance';
import { QueryPredicateFunctionTransform } from './QueryPredicateFunctionTransform';
import { RepositoryOptions } from '../model/RepositoryOptions';
import { MQuery, MQuerySimple } from '../model/MQuery';

export class ManualQueryHelper {

    static async executeQueryManual(className: string, query: Array<MQuery | MQuerySimple>): Promise<Array<any>> {

        const repositoryOptions: RepositoryOptions | undefined = QueryPredicateFunctionTransform.classConfig.get(className)

        if (repositoryOptions && query.length > 0) {

            const firestoreInstance: Firestore = FirestoreInstance.getInstance()

            const collection = firestoreInstance.collection(repositoryOptions.collection)

            let queryList: Array<MQuery>

            if (query.some(que => Object.keys(que).length == 1)) {
                queryList = this.convertToMQuery(query as Array<MQuerySimple>)
            } else {
                queryList = query as Array<MQuery>
            }

            const queryInit = queryList[0]

            let queryExecute: FirebaseFirestore.Query = collection.where(queryInit.field, queryInit.operator, queryInit.value)

            queryList.shift()

            queryList.forEach(que => {
                queryExecute = queryExecute.where(que.field, que.operator, que.value)
            })

            const snapshot = await queryExecute.get()

            return this.getData(snapshot)
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