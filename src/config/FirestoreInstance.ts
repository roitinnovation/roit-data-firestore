import { Firestore } from "@google-cloud/firestore";
import { RepositorySystemException } from "../exception/RepositorySystemException";

export class FirestoreInstance {

    private static instance: FirestoreInstance = new FirestoreInstance()

    private firestore: Firestore;

    constructor() {
        if (process.env.ENV === 'test') { return }

        const projectId = process.env.FIRESTORE_PROJECTID || process.env.PROJECT_ID

        if (!projectId && !process.env.JEST_WORKER_ID) {
            throw new RepositorySystemException(`ProjectId is required in env.yaml {firestore.projectId}`)
        }

        try {
            this.firestore = new Firestore({
                projectId
            })
            this.firestore.settings({ 
                ignoreUndefinedProperties: Boolean(process.env.FIRESTORE_IGNOREUNDEFINEDPROPERTIES || false), 
                databaseId: process.env.FIRESTORE_DATABASEID
            });
        } catch (err) {
            console.error(err)
            throw new RepositorySystemException(`Error in initializeApp: ${err}`)
        }
    }

    public static getInstance(): Firestore {
        return this.instance.firestore;
    }

}