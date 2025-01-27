import { PersistFirestoreReadEnrichedProps } from "../../model/PersistFirestoreReadProps";
import { PlatformTools } from "../../platform/PlatformTools";
import { FirestoreReadAuditProvider } from "./FirestoreReadAuditProvider";

export class PubSubFirestoreReadAuditProvider implements FirestoreReadAuditProvider {

    private pubsub: any

    private topic: any

    private constructor() {
        const { PubSub } = this.loadPubSub()
        const projectId = process.env.FIRESTORE_PROJECTID
    
        if (!projectId) {
            throw new Error(`projectId is required in env.yaml {firestore.projectId}`)
        }

        this.pubsub = new PubSub({
            projectId
        })

        const envTopic = process.env.FIRESTORE_AUDIT_PUBSUBTOPIC

        if (!envTopic) {
            throw new Error(`pubSubTopic is required in env.yaml {firestore.audit.pubSubTopic}`)
        }

        this.topic = this.pubsub.topic(envTopic, { batching: { maxMessages: 1 } })   
    }
    
    async persistFirestoreRead(params: PersistFirestoreReadEnrichedProps): Promise<void> {
        const limitBytes = 9900000
        let buffer = Buffer.from(JSON.stringify(params))
        if (buffer.length > limitBytes) {
            params.queryResult = 'too-big-to-save'
            buffer = Buffer.from(JSON.stringify(params))
        }
        
        try {
            await this.topic.publishMessage({
                data: buffer
            })
        } catch (error) {
            console.log(JSON.stringify(error))
        }
        
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