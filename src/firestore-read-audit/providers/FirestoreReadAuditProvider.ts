import { PersistFirestoreReadProps } from "../../model/PersistFirestoreReadProps";

export interface FirestoreReadAuditProvider {
    persistFirestoreRead(params: PersistFirestoreReadProps): Promise<void>
}