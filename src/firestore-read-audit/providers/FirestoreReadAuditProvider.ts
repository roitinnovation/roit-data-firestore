import { PersistFirestoreReadEnrichedProps } from "../../model/PersistFirestoreReadProps";

export interface FirestoreReadAuditProvider {
    persistFirestoreRead(params: PersistFirestoreReadEnrichedProps): Promise<void>
}