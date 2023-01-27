import { Environment } from "roit-environment";
import { PersistFirestoreReadProps } from "../../model/PersistFirestoreReadProps";
import { PlatformTools } from "../../platform/PlatformTools";
import { FirestoreReadAuditProvider } from "./FirestoreReadAuditProvider";

export class PubSubFirestoreReadAuditProvider implements FirestoreReadAuditProvider {

    private static instance = new PubSubFirestoreReadAuditProvider

    private pubsub: any

    private topic: any

    private constructor() {
        const { PubSub } = this.loadPubSub()
        const projectId = Environment.getProperty("firestore.projectId")
    
        if (!projectId) {
            throw new Error(`projectId is required in env.yaml {firestore.projectId}`)
        }

        this.pubsub = new PubSub({
            projectId
        })

        const envTopic = Environment.getProperty('firestore.audit.pubSubTopic')

        if (!envTopic) {
            throw new Error(`projectId is required in env.yaml {firestore.audit.pubSubTopic}`)
        }

        this.topic = this.pubsub.topic(envTopic, { batching: { maxMessages: 1 } })   
    }

    static getInstance() {
        return this.instance
    }
    
    async persistFirestoreRead(params: PersistFirestoreReadProps): Promise<void> {
        const limitBytes = 9900000
        let buffer = Buffer.from(JSON.stringify(params))
        if (buffer.length > limitBytes) {
            params.queryResult = 'too-big-to-save'
            buffer = Buffer.from(JSON.stringify(params))
        }
        
        await this.topic.publishMessage({
            data: buffer
        })
    }

    private loadPubSub(): any {
        try {
            return PlatformTools.load("pubsub")
        } catch (e) {
            console.log(e)
            throw new Error(
                `Cannot use Firestore Read Audit because PubSub is not installed. Please run "npm i @google-cloud/pubsub@3.3.0 --save-exact".`,
            )
        }
    }

}