import { Environment } from "roit-environment"
import { PersistFirestoreReadProps } from "../model/PersistFirestoreReadProps"
import { BigQueryFirestoreReadAuditProvider } from "./providers/BigQueryFirestoreReadAuditProvider"

export class FirestoreReadAuditResolver {

    private static instance: FirestoreReadAuditResolver = new FirestoreReadAuditResolver()

    private provider: BigQueryFirestoreReadAuditProvider

    constructor() {
        if (Environment.getProperty('firestore.enableReadAudit') && !this.isReadAuditTimeEnded()) {
            this.provider = new BigQueryFirestoreReadAuditProvider()
        }
    }

    static getInstance(): FirestoreReadAuditResolver {
        return this.instance
    }

    private isReadAuditTimeEnded() {
        const readAuditEndAt = Environment.getProperty('firestore.readAuditEndAt')
        if (readAuditEndAt) {
            return new Date(readAuditEndAt) < new Date()
        }
        return false
    }

    async persistFirestoreRead(props: PersistFirestoreReadProps) {
        if (this.provider) {
            if (!this.isReadAuditTimeEnded()) {
                await this.provider.persistFirestoreRead(props)
            }
        }
    }

}