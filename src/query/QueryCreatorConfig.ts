import { CollectionReference, DocumentData, Query } from "@google-cloud/firestore";
import { Paging } from "../model/Paging";

export class QueryCreatorConfig {

    buildPaging(collectionRef: CollectionReference<DocumentData>, paging?: Paging): Query<DocumentData> {

        const orderBy = paging?.orderBy || ''
        const orderByDirection = paging?.orderByDirection || 'asc'
        const startAfter = paging?.cursor
        const limit = paging?.limit ?? 1000

        let documentRef: Query<DocumentData> = collectionRef.limit(limit)

        if(orderBy) {
            documentRef = documentRef.orderBy(orderBy, orderByDirection)
        }

        if(startAfter) {
            documentRef= documentRef.startAfter(startAfter)
        }

        return documentRef
    }

}