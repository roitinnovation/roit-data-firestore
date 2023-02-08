import { Environment } from "roit-environment"
import { PersistFirestoreReadProps } from "../model/PersistFirestoreReadProps"
import { BigQueryFirestoreReadAuditProvider } from "./providers/BigQueryFirestoreReadAuditProvider"
import { FirestoreReadAuditProvider } from "./providers/FirestoreReadAuditProvider"
import { PubSubFirestoreReadAuditProvider } from "./providers/PubSubFirestoreReadAuditProvider"

export class FirestoreReadAuditResolver {

    private static instance: FirestoreReadAuditResolver = new FirestoreReadAuditResolver()

    private provider: FirestoreReadAuditProvider

    private providersImplMap: Map<string, any> = new Map

    private constructor() {
        this.providersImplMap.set('PubSub', PubSubFirestoreReadAuditProvider)
        this.providersImplMap.set('BigQuery', BigQueryFirestoreReadAuditProvider)

        if (Environment.getProperty('firestore.audit.enable') && !this.isReadAuditTimeEnded()) {
            const envProvider = Environment.getProperty('firestore.audit.provider') || 'PubSub'
            const providerImpl = this.providersImplMap.get(envProvider)
            this.provider = new providerImpl()
        }
    }

    static getInstance(): FirestoreReadAuditResolver {
        return this.instance
    }

    private isReadAuditTimeEnded() {
        const readAuditEndAt = Environment.getProperty('firestore.audit.endAt')
        if (readAuditEndAt) {
            return new Date(readAuditEndAt) < new Date()
        }
        return false
    }

    async persistFirestoreRead(props: PersistFirestoreReadProps) {
        if (this.provider && !this.isReadAuditTimeEnded()) {
            let queryResultLength = 1

            if (Array.isArray(props.queryResult)) {
                queryResultLength = props.queryResult.length
            }

            await this.provider.persistFirestoreRead({
                ...props,
                env: Environment.currentEnv(),
                insertAt: new Date().toISOString().slice(0, -1),
                projectId: Environment.getProperty('firestore.projectId'),
                service: Environment.getProperty('service'),
                queryResult: JSON.stringify(props.queryResult),
                queryResultLength: queryResultLength
            })
        }
    }

}