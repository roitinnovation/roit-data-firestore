import { CollectionReference, DocumentData, Query } from "@google-cloud/firestore";
import { Paging } from "../model/Paging";

export class QueryCreatorConfig {

    buildPaging(collectionRef: CollectionReference<DocumentData>, paging?: Paging): Query<DocumentData> {
        const orderByDirection = paging?.orderByDirection || 'asc'
        const limit = paging?.limit ?? 1000

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

        return documentRef
    }

}