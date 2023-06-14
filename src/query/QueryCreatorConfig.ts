import { CollectionReference, DocumentData, Query } from "@google-cloud/firestore";
import { Paging } from "../model/Paging";

export class QueryCreatorConfig {

    async buildPaging(collectionRef: CollectionReference<DocumentData>, paging?: Paging): 
        Promise<{ documentRef: Query<DocumentData>; totalItens: number | null }> {
        const orderByDirection = paging?.orderByDirection || 'asc'
        const limit = paging?.limit ?? 1000
        let totalItens: number | null = null

        if (paging?.showCount) {
            const itensQuery = await collectionRef.count().get()
            totalItens = itensQuery.data().count
        }

        let documentRef: Query<DocumentData> = collectionRef.limit(limit)

        if (paging?.orderBy) {
            const ordersBy = Array.isArray(paging.orderBy) ? paging.orderBy : [paging.orderBy]
            ordersBy.forEach(order =>
                documentRef = documentRef.orderBy(order, orderByDirection)
            )
        }

        if (paging?.cursor) {
            const startAfter = Array.isArray(paging.cursor) ? paging.cursor : [paging.cursor]
            documentRef = documentRef.startAfter(...startAfter)
        }

        return {
            documentRef,
            totalItens
        }
    }

}